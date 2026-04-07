import { HttpStatus, Injectable } from '@nestjs/common';

import { ErrorException } from '@/common/exceptions/error.exception';
import { RoleType } from '@/entities';
import { MemberRepository } from '@/entities/member/member.repository';
import { OrganizationRepository } from '@/entities/organization/organization.repository';
import { UserRepository } from '@/entities/user/user.repository';

import { InviteStaffDto, UpdateStaffDto } from './dto/staff.dto';

@Injectable()
export class StaffService {
  constructor(
    private readonly memberRepo: MemberRepository,
    private readonly userRepo: UserRepository,
    private readonly organizationRepo: OrganizationRepository,
  ) {}

  async findAll(organizationId: string) {
    return this.memberRepo.find(
      { organization: organizationId },
      { populate: ['user'] },
    );
  }

  async findOne(organizationId: string, memberId: string) {
    const member = await this.memberRepo.findOne(
      { id: memberId, organization: organizationId },
      { populate: ['user'] },
    );

    if (!member) {
      throw new ErrorException('MEMBER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    return member;
  }

  async invite(organizationId: string, dto: InviteStaffDto) {
    const org = await this.organizationRepo.findOne(organizationId);
    if (!org) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    let user = await this.userRepo.findOne({ email: dto.email });
    if (!user) {
      user = this.userRepo.create({
        email: dto.email,
        name: dto.name,
        emailVerified: true,
      });
      this.userRepo.getEntityManager().persist(user);
    }

    const existingMember = await this.memberRepo.findOne({
      user: user.id,
      organization: organizationId,
    });
    if (existingMember) {
      throw new ErrorException('ALREADY_MEMBER', HttpStatus.BAD_REQUEST);
    }

    const member = this.memberRepo.create({
      user,
      organization: org,
      role: dto.role,
    }).persist();

    await this.memberRepo.populate(member, ['user']);
    return member;
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

  async remove(organizationId: string, memberId: string) {
    const member = await this.findOne(organizationId, memberId);

    if (member.role === RoleType.OWNER) {
      const ownerCount = await this.memberRepo.count({
        organization: organizationId,
        role: RoleType.OWNER,
      });
      if (ownerCount <= 1) {
        throw new ErrorException('LAST_OWNER_CANNOT_BE_REMOVED', HttpStatus.BAD_REQUEST);
      }
    }

    member.remove();
  }
}
