import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorException } from '@/common/exceptions/error.exception';
import { signInvitationToken, verifyInvitationToken } from '@/common/tools/JWT';
import { mailer } from '@/common/tools/Mailer';
import { InvitationStatus, RoleType, Term } from '@/entities';
import { InvitationRepository } from '@/entities/invitation/invitation.repository';
import { MemberRepository } from '@/entities/member/member.repository';
import { OrganizationRepository } from '@/entities/organization/organization.repository';
import { TermRepository } from '@/entities/term/term.repository';
import { UserRepository } from '@/entities/user/user.repository';

import { TermResponseDto } from '../terms/dto/terms.dto';
import { InviteStaffDto, StaffResponseDto, UpdateStaffDto } from './dto/staff.dto';

@Injectable()
export class StaffService {
  constructor(
    private readonly memberRepo: MemberRepository,
    private readonly userRepo: UserRepository,
    private readonly organizationRepo: OrganizationRepository,
    private readonly invitationRepo: InvitationRepository,
    private readonly termVersionRepo: TermRepository,
  ) { }

  async findAll(organizationId: string): Promise<StaffResponseDto[]> {
    const members = await this.memberRepo.find(
      { organization: organizationId, deletedAt: null },
      {
        populate: ['user', 'user.termAgreements', 'user.termAgreements.term', 'user.termAgreements.term.category', 'user.termAgreements.term.category.organization'],
        filters: { 'soft-delete': false }, // 동의내역의 이력(취소 포함) 조회를 위해 소프트델리트 필터 해제
      },
    );

    const pendingInvitations = await this.invitationRepo.find({
      organization: organizationId,
      status: InvitationStatus.PENDING,
      expiresAt: { $gt: new Date() },
    });

    const staffMembers: StaffResponseDto[] = members.map((m) => {
      const termAgreements = m.user.termAgreements.getItems()
        .filter((ta) => !ta.term.category.organization || ta.term.category.organization.id === organizationId)
        .map((ta) => ({
          versionId: ta.term.id,
          title: ta.term.category.title,
          version: ta.term.version,
          agreedAt: ta.agreedAt || ta.createdAt,
          deletedAt: ta.deletedAt,
        }));

      return {
        id: m.id,
        role: m.role,
        user: {
          id: m.user.id,
          name: m.user.name,
          email: m.user.email,
        },
        status: InvitationStatus.ACCEPTED,
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
        termAgreements,
      };
    });

    const invitedStaff: StaffResponseDto[] = pendingInvitations.map((i) => ({
      id: i.id,
      role: i.role,
      user: {
        id: '', // No user yet
        name: i.name,
        email: i.email,
      },
      status: i.status,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));

    return [...staffMembers, ...invitedStaff];
  }

  async findOne(organizationId: string, memberId: string) {
    const member = await this.memberRepo.findOne(
      { id: memberId, organization: organizationId, deletedAt: null },
      { populate: ['user'] },
    );

    if (!member) {
      throw new ErrorException('MEMBER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return member;
  }

  async invite(organizationId: string, inviterId: string, dto: InviteStaffDto) {
    const org = await this.organizationRepo.findOne(organizationId);
    if (!org) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // 기존 멤버 확인
    const existingUser = await this.userRepo.findOne({ email: dto.email });
    if (existingUser) {
      const existingMember = await this.memberRepo.findOne({
        user: existingUser.id,
        organization: organizationId,
      });
      if (existingMember) {
        throw new ErrorException('ALREADY_MEMBER', HttpStatus.BAD_REQUEST);
      }
    }

    // 대기 중인 초대장 취소
    const pendingInvites = await this.invitationRepo.find({
      email: dto.email,
      organization: organizationId,
      status: InvitationStatus.PENDING,
    });
    for (const invite of pendingInvites) {
      invite.status = InvitationStatus.CANCELED;
    }

    // 인증 토큰 생성
    const expire = 1000 * 60 * 60 * 24 * 7;

    const invitation = this.invitationRepo.create({
      email: dto.email,
      name: dto.name,
      organization: org,
      role: dto.role,
      inviter: inviterId,
      expiresAt: new Date(Date.now() + expire),
    }).persist();

    // JWT 토큰 생성
    const token = await signInvitationToken({
      invitationId: invitation.id,
      email: invitation.email,
    });

    // 메일 발송
    const url = new URL('/sign-up/invite', process.env.WEB_URL);
    url.searchParams.set('token', token);

    const inviteUrl = url.toString();
    await mailer.sendMail({
      to: process.env.EMAIL || invitation.email,
      subject: `[${org.name}] 스태프 초대 안내`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333;">스태프 초대 안내</h2>
          <p style="color: #666; line-height: 1.6;">안녕하세요. <strong>${org.name}</strong> 조직에 스태프로 초대되셨습니다.</p>
          <p style="color: #666; line-height: 1.6;">아래 버튼을 클릭하여 초대를 수락하고 조직의 멤버로 합류해주세요.</p>
          <div style="margin: 40px 0; text-align: center;">
            <a href="${inviteUrl}" style="background-color: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">초대 수락하기</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 40px;">만약 버튼이 작동하지 않는다면 아래 주소를 브라우저에 붙여넣어주세요.</p>
          <p style="color: #007bff; font-size: 12px; word-break: break-all;">${inviteUrl}</p>
        </div>
      `,
    });
    return invitation;
  }

  async acceptInvite(token: string, userId: string) {
    const invitation = await this.findInvitation(token);

    const user = await this.userRepo.findOne(userId);
    if (!user || user.email !== invitation.email) {
      throw new ErrorException('INVALID_USER_FOR_INVITATION', HttpStatus.FORBIDDEN);
    }

    const existingMember = await this.memberRepo.findOne({
      user: user.id,
      organization: invitation.organization.id,
    });

    if (existingMember) {
      invitation.status = InvitationStatus.ACCEPTED;
      return existingMember;
    }

    const member = this.memberRepo.create({
      user,
      organization: invitation.organization,
      role: invitation.role,
    });

    invitation.status = InvitationStatus.ACCEPTED;
    return member;
  }

  async rejectInvite(token: string) {
    const invitation = await this.findInvitation(token);

    invitation.status = InvitationStatus.REJECTED;

    return 'ok';
  }

  async findInvitation(token: string) {
    const payload = await verifyInvitationToken(token);
    if (!payload) {
      throw new ErrorException('INVALID_OR_EXPIRED_INVITATION', HttpStatus.BAD_REQUEST);
    }

    const invitation = await this.invitationRepo.findOne(
      {
        id: payload.invitationId,
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() },
      },
      { populate: ['organization', 'inviter'] },
    );

    if (!invitation || invitation.email !== payload.email) {
      throw new ErrorException('INVALID_OR_EXPIRED_INVITATION', HttpStatus.BAD_REQUEST);
    }

    return invitation;
  }

  async findInvitationTerms(token: string): Promise<TermResponseDto[]> {
    const invitation = await this.findInvitation(token);

    const versions = await this.termVersionRepo.find({
      category: {
        organization: invitation.organization.id,
        isActive: true,
      },
    }, {
      populate: ['category'],
      orderBy: { createdAt: 'DESC' },
    });

    // 중복 제거 (최신 버전만)
    const seen = new Set<string>();
    const latestVersions = (versions as Term[]).filter((v) => {
      if (seen.has(v.category.id)) return false;
      seen.add(v.category.id);
      return true;
    });

    return latestVersions.map((v) => ({
      id: v.id, // 일관성을 위해 versionId를 id로 전달 (회원가입 로직과 동일)
      title: v.category.title,
      content: v.content,
      version: v.version,
      termType: v.category.termType,
      isActive: v.category.isActive,
      startDate: v.startDate,
      endDate: v.endDate,
      updatedAt: v.updatedAt,
      createdAt: v.createdAt,
    }));
  }

  async update(organizationId: string, memberId: string, dto: UpdateStaffDto) {
    const member = await this.findOne(organizationId, memberId);

    if (member.role === RoleType.OWNER && dto.role !== RoleType.OWNER) {
      const ownerCount = await this.memberRepo.count({
        organization: organizationId,
        role: RoleType.OWNER,
      });
      if (ownerCount <= 1) {
        throw new ErrorException('LAST_OWNER_CANNOT_BE_CHANGED', HttpStatus.BAD_REQUEST);
      }
    }

    member.role = dto.role;
    return member;
  }

  async remove(organizationId: string, id: string, actorUserId: string) {
    // 1. 멤버에서 확인
    const member = await this.memberRepo.findOne({ id, organization: organizationId, deletedAt: null }, { populate: ['user'] });
    if (member) {
      if (member.role === RoleType.OWNER) {
        const ownerCount = await this.memberRepo.count({
          organization: organizationId,
          role: RoleType.OWNER,
          deletedAt: null,
        });
        if (ownerCount <= 1) {
          throw new ErrorException('LAST_OWNER_CANNOT_BE_REMOVED', HttpStatus.BAD_REQUEST);
        }
      }

      if (member.user.id === actorUserId && member.role === RoleType.OWNER) {
        const activeOwnerCount = await this.memberRepo.count({
          organization: organizationId,
          role: RoleType.OWNER,
          deletedAt: null,
        });
        if (activeOwnerCount <= 1) {
          throw new ErrorException('FORBIDDEN', HttpStatus.FORBIDDEN);
        }
      }

      member.deletedAt = new Date();
      member.deletedBy = actorUserId;
      return;
    }

    // 2. 초대에서 확인
    const invitation = await this.invitationRepo.findOne({ id, organization: organizationId });
    if (invitation) {
      if (invitation.status === InvitationStatus.PENDING) {
        invitation.status = InvitationStatus.CANCELED;
        return;
      }
    }

    throw new ErrorException('NOT_FOUND', HttpStatus.NOT_FOUND);
  }
}
