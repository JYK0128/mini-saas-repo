import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { verify } from 'otplib';

import { ErrorException } from '@/common/exceptions/error.exception';
import { verifyInvitationToken } from '@/common/tools/JWT';
import { mailer } from '@/common/tools/Mailer';
import { generateOtp } from '@/common/tools/OTP';
import { AccountRepository, InvitationRepository, InvitationStatus, MemberRepository, Organization, ProviderType, TermAgreementRepository, TermRepository, TermType, UserRepository, VerificationRepository } from '@/entities';

import { ConfirmEmailVerificationDto, type ConfirmPhoneVerificationDto, type CreateAccountDto, type RequestEmailVerificationDto, type RequestPhoneVerificationDto, ResendEmailVerificationDto } from './dto';

@Injectable()
export class SignUpService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly accountRepo: AccountRepository,
    private readonly verificationRepo: VerificationRepository,
    private readonly termRepo: TermRepository,
    private readonly termAgreementRepo: TermAgreementRepository,
    private readonly invitationRepo: InvitationRepository,
    private readonly memberRepo: MemberRepository,
  ) {}

  /**
   * 유저 이메일(아이디) 중복 확인
   */
  async checkEmailDuplicate({
    email,
  }: RequestEmailVerificationDto) {
    const exists = await this.userRepo.exist({ email });
    if (exists) {
      throw new ErrorException('USER_ALREADY_EXISTS', 409);
    }
    return exists;
  }

  /**
   * 유저 휴대폰인증 요청
   */
  async requestPhoneVerification({
    phoneNumber,
  }: RequestPhoneVerificationDto) {
    const { secret, token } = await generateOtp();
    const verification = this.verificationRepo.createVerification(
      phoneNumber,
      secret,
      60 * 3 * 1000,
    );

    try {
      this.verificationRepo.persist(verification);
      await this.verificationRepo.flush();
    }
    catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ErrorException('TOO_MANY_REQUESTS', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw error;
    }

    return token;
  }

  /**
   * 유저 휴대폰코드 전송
   */
  async sendPhoneVerificationCode({
    phoneNumber,
    token,
  }: ConfirmPhoneVerificationDto) {
    await mailer.sendMail({
      to: process.env.EMAIL || phoneNumber,
      subject: '휴대폰 인증',
      text: `인증번호: ${token}`,
    });
  }

  /**
   * 유저 휴대폰인증 확인
   */
  async confirmPhoneVerification({
    phoneNumber,
    token,
  }: ConfirmPhoneVerificationDto) {
    const verification = await this.verificationRepo.findActiveVerification(phoneNumber);
    if (!verification?.value) {
      throw new ErrorException('VERIFICATION_NOT_FOUND', HttpStatus.BAD_REQUEST);
    }

    const { valid } = await verify({
      secret: verification.value,
      token,
      epochTolerance: 60 * 3,
    });
    if (!valid) {
      throw new ErrorException('INVALID_VERIFICATION_TOKEN', HttpStatus.BAD_REQUEST);
    }

    verification.verifiedAt = new Date();

    return verification.id;
  }

  /**
   * 유저 이메일인증 요청
   */
  async requestEmailVerification({
    email,
  }: RequestEmailVerificationDto) {
    const { secret, token } = await generateOtp();
    const verification = this.verificationRepo.createVerification(
      email,
      secret,
      60 * 30 * 1000,
    );

    try {
      this.verificationRepo.persist(verification);
      await this.verificationRepo.flush();
    }
    catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ErrorException('TOO_MANY_REQUESTS', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw error;
    }

    return { id: verification.id, token };
  }

  /**
   * 유저 이메일코드 전송
   */
  async sendEmailVerificationCode({
    id,
    token,
  }: ConfirmEmailVerificationDto, email: string) {
    const url = new URL('/sign-up/email-confirm', process.env.WEB_URL);
    url.searchParams.set('token', token.toString().padStart(6, '0'));
    url.searchParams.set('id', id);

    const verificationUrl = url.toString();
    await mailer.sendMail({
      to: process.env.EMAIL || email,
      subject: '이메일 인증',
      html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #333;">이메일 인증 안내</h2>
            <p style="color: #666; line-height: 1.6;">안녕하세요. Admin Portal 가입을 위한 필수 단계입니다.</p>
            <p style="color: #666; line-height: 1.6;">아래 버튼을 클릭하여 이메일 인증을 완료하고 대시보드 권한을 활성화해주세요.</p>
            <div style="margin: 40px 0; text-align: center;">
              <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">이메일 인증 완료하기</a>
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 40px;">만약 버튼이 작동하지 않는다면 아래 주소를 브라우저에 붙여넣어주세요.</p>
            <p style="color: #007bff; font-size: 12px; word-break: break-all;">${verificationUrl}</p>
          </div>
        `,
    });
  }

  /**
   * 유저 이메일인증 확인
   */
  async confirmEmailVerification(
    {
      id,
      token,
    }: ConfirmEmailVerificationDto,
  ) {
    const verification = await this.verificationRepo.findOne({
      id,
      expiresAt: { $gt: new Date() },
    });
    if (!verification?.value) {
      throw new ErrorException('VERIFICATION_NOT_FOUND', HttpStatus.BAD_REQUEST);
    }

    const { valid } = await verify({
      secret: verification.value,
      token,
      epochTolerance: 180,
    });
    if (!valid) {
      throw new ErrorException('INVALID_VERIFICATION_TOKEN', HttpStatus.BAD_REQUEST);
    }

    verification.verifiedAt = new Date();
    await this.userRepo.nativeUpdate(
      { email: verification.identifier },
      { emailVerified: true },
    );
  }

  /**
   * 약관 목록 조회
   */
  async getTerms(email?: string) {
    let organization: Organization | undefined;

    if (email) {
      const invitation = await this.invitationRepo.findOne({
        email,
        status: InvitationStatus.PENDING,
        expiresAt: { $gt: new Date() },
      }, { populate: ['organization'] });
      organization = invitation?.organization;
    }

    const terms = await this.termRepo.findActiveTerms(organization);
    return terms;
  }

  /**
   * 유저정보 및 필수약관 확인
   */
  async createAccount(
    token: string,
    {
      name,
      email,
      phoneNumber,
      password,
      confirmPassword,
      termIds,
    }: CreateAccountDto) {
    // 비밀번호 확인
    if (password !== confirmPassword) {
      throw new ErrorException('PASSWORD_MISMATCH', HttpStatus.BAD_REQUEST);
    }

    // 초대 확인
    const pendingInvitations = await this.invitationRepo.find({
      email,
      status: InvitationStatus.PENDING,
      expiresAt: { $gt: new Date() },
    });
    const isInvited = pendingInvitations.length > 0;

    // 약관 확인
    const activeVersions = await this.getTerms(email);
    const termAgreements = activeVersions.map((v) => {
      return { ...v, agreedAt: termIds.includes(v.id) ? new Date() : undefined };
    });
    const isDenied = termAgreements.some((v) => {
      return v.termType === (TermType.REQUIRED as string) && !v.agreedAt;
    });
    if (isDenied) {
      throw new ErrorException('TERMS_REQUIRED', HttpStatus.BAD_REQUEST);
    }

    // 휴대폰 인증 확인
    const verification = await this.verificationRepo.findOne({
      id: token,
      identifier: phoneNumber,
      verifiedAt: { $ne: null },
    });
    if (!verification) {
      throw new ErrorException('INVALID_VERIFICATION_TOKEN', HttpStatus.BAD_REQUEST);
    }

    // 인증토큰 삭제
    verification.remove();

    // 유저 생성
    const user = this.userRepo.create({
      name,
      email,
      emailVerified: isInvited,
      phoneNumber,
      phoneNumberVerified: true,
    }).persist();

    // 초대완료 처리, 멤버십 적용
    for (const invitation of pendingInvitations) {
      const existingMember = await this.memberRepo.findOne({
        user: user.id,
        organization: invitation.organization.id,
      });

      if (!existingMember) {
        this.memberRepo.create({
          user,
          organization: invitation.organization,
          role: invitation.role,
        }).persist();
      }

      invitation.status = InvitationStatus.ACCEPTED;
    }

    // 동의내역
    for (const ta of termAgreements) {
      this.termAgreementRepo.create({
        user,
        term: ta.id,
        agreedAt: ta.agreedAt,
      }).persist();
    }

    // 계정 생성
    this.accountRepo.create({
      user,
      accountId: email,
      providerId: ProviderType.CREDENTIAL,
      password: bcrypt.hashSync(password, 10),
    }).persist();

    return user;
  }

  /**
   * 유저 이메일인증 재발송
   */
  async resendEmailVerification({
    email,
  }: ResendEmailVerificationDto) {
    const user = await this.userRepo.findOne({ email });
    if (!user) {
      throw new ErrorException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    if (user.emailVerified) {
      throw new ErrorException('EMAIL_ALREADY_VERIFIED', HttpStatus.BAD_REQUEST);
    }

    const { id, token } = await this.requestEmailVerification({ email });
    await this.sendEmailVerificationCode({ id, token }, email);
  }

  /**
   * 초대장 정보 조회 (토큰 검증)
   */
  async getInvitation(token: string) {
    // JWT 검증
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
      { populate: ['organization'] },
    );

    if (!invitation || invitation.email !== payload.email) {
      throw new ErrorException('INVALID_OR_EXPIRED_INVITATION', HttpStatus.BAD_REQUEST);
    }

    return invitation;
  }

  /**
   * 초대 거절
   */
  async rejectInvite(token: string) {
    const invitation = await this.getInvitation(token);
    invitation.status = InvitationStatus.REJECTED;
    return 'ok';
  }

  /**
   * 초대 수락 (기존 회원용)
   */
  async acceptInvite(token: string, userId: string) {
    const invitation = await this.getInvitation(token);

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
}
