import { Transactional } from '@mikro-orm/decorators/legacy';
import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { verify } from 'otplib';

import { ErrorException } from '@/common/exceptions/error.exception';
import { signEmailToken, verifyEmailToken } from '@/common/tools/JWT';
import { mailer } from '@/common/tools/Mailer';
import { generateOtp } from '@/common/tools/OTP';
import { AccountRepository, MemberRepository, OrganizationRepository, OrganizationType, ProviderType,
         RoleType, TermAgreementRepository, TermRepository, TermType, User,
         UserRepository, VerificationRepository } from '@/entities';

import type { CreateOrganizationDto, FindIdDto, FindPasswordDto, LoginDto, ResetPasswordDto, SetNewAgreementsDto } from './dto';

@Injectable()
export class SignInService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly memberRepo: MemberRepository,
    private readonly accountRepo: AccountRepository,
    private readonly verificationRepo: VerificationRepository,
    private readonly organizationRepo: OrganizationRepository,
    private readonly termAgreementRepo: TermAgreementRepository,
    private readonly termRepo: TermRepository,
  ) {}

  /**
   * 1. 로그인 - 로그인
   */
  async validateUser({
    accountId,
    password,
    token,
  }: LoginDto) {
    const account = await this.accountRepo.findOne(
      { accountId, providerId: ProviderType.CREDENTIAL },
      { populate: ['user', 'user.member', 'user.member.organization'] },
    );

    // 계정 또는 패스워드 없음
    if (!account || !account.password) {
      throw new ErrorException('INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED);
    }
    // 로그인 실패 횟수가 5회 이상
    if (account.failCount >= 5) {
      throw new ErrorException('ACCOUNT_LOCKED', HttpStatus.UNAUTHORIZED);
    }
    // 이메일 미인증 사용자
    if (!account.user.emailVerified) {
      throw new ErrorException('EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN);
    }

    // 패스워드 검증 실패
    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      account.failCount += 1;
      account.persist();
      throw new ErrorException('INVALID_CREDENTIALS', HttpStatus.UNAUTHORIZED);
    }

    // 2단계 인증 사용
    const { twoFactorSecret, twoFactorEnabled } = account.user;
    if (twoFactorEnabled && twoFactorSecret) {
      if (!token) {
        throw new ErrorException('TWO_FACTOR_ENABLED', HttpStatus.FORBIDDEN);
      }
      else {
        const { valid } = await verify({
          token,
          secret: twoFactorSecret,
        });
        if (!valid) {
          throw new ErrorException('INVALID_TWO_FACTOR_TOKEN', HttpStatus.UNAUTHORIZED);
        }
      }
    }

    // 로그인 성공
    account.failCount = 0;
    account.persist();
    return account.user;
  }

  /**
   * 2. 로그인 추가기능 - 신규가입 대상 최초 로그인 시 조직 생성
   */
  async createOrganization(
    user: User,
    {
      name,
    }: CreateOrganizationDto) {
    // 이미 멤버십이 있는 경우
    if (user.member) {
      throw new ErrorException('ALREADY_HAS_MEMBERSHIP', HttpStatus.BAD_REQUEST);
    }

    // 조직 생성
    const newOrganization = this.organizationRepo
      .createOrganization(name, OrganizationType.BUSINESS);

    return Promise.resolve(
      this.memberRepo.connectMember(
        user,
        newOrganization,
        RoleType.OWNER,
      ),
    );
  }

  /**
   * 3.약관 재동의 - 미동의 약관 조회
   */
  async getNewAgreements(
    user: User,
  ) {
    const terms = await this.termAgreementRepo
      .findActiveAgreementsByUser(user);
    const history = await this.termAgreementRepo
      .findAgreementsHistory(user);

    // 이미 동의했던 카테고리 ID 목록 수집
    const agreedCategoryIds = new Set(
      history.map((h) => h.term.category.id),
    );

    // 동의가 필요한 약관 식별
    const targets = terms.filter((term) => {
      // 현재 약관동의내역 없는 경우
      if (!term.agreementId) {
        // 선택약관
        if (term.termType === (TermType.OPTIONAL as string)) {
          // 이전 동의한 경우
          return agreedCategoryIds.has(term.categoryId);
        }
        return true;
      }
      return false;
    });

    return targets;
  }

  /**
   * 3.약관 재동의 - 미동의 약관 동의
   */
  async setNewAgreements(
    user: User,
    {
      termIds,
    }: SetNewAgreementsDto,
  ) {
    const terms = await this.termAgreementRepo
      .findActiveAgreementsByUser(user);

    for (const term of terms) {
      // 이미 동의한 약관은 건너뜀
      if (term.agreedAt) {
        continue;
      }

      if (termIds.includes(term.id)) {
        await this.termAgreementRepo.createTermAgreement(
          user,
          this.termRepo.getReference(term.id),
        );
      }
      else {
        if (term.termType === (TermType.REQUIRED as string)) {
          throw new ErrorException('REQUIRED_TERM_NOT_AGREED', HttpStatus.BAD_REQUEST);
        }
      }
    }
  }

  /**
   * 4. 기능 - 아이디 찾기
   */
  async forgetId({
    name,
    phoneNumber,
  }: FindIdDto) {
    const user = await this.userRepo.findCredentialUser({ name, phoneNumber });
    if (!user) {
      throw new ErrorException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const [localPart, domain] = user.email.split('@');
    const visiblePrefix = localPart.slice(0, 2);
    const hiddenCount = Math.max(localPart.length - visiblePrefix.length, 1);
    const maskedEmail = `${visiblePrefix}${'*'.repeat(hiddenCount)}@${domain}`;
    return { email: maskedEmail };
  }

  /**
   * 4. 기능 - 비밀번호 찾기
   */
  async forgetPassword({
    name,
    email,
    phoneNumber,
  }: FindPasswordDto) {
    const user = await this.userRepo.findCredentialUser({ name, email, phoneNumber });
    if (!user) {
      throw new ErrorException('USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const { secret, token } = await generateOtp();
    this.verificationRepo.createVerification(
      email,
      secret,
      30 * 60 * 1000,
    );

    const verificationId = await signEmailToken({ email, token });
    const url = new URL('/reset-password', process.env.WEB_URL);
    url.searchParams.set('token', verificationId);

    const resetUrl = url.toString();
    await mailer.sendMail({
      to: process.env.EMAIL || email,
      subject: '[Admin] 비밀번호 재설정 안내',
      text: [
        '비밀번호 재설정 요청을 확인했습니다.',
        '',
        `재설정 링크: ${resetUrl}`,
        '',
        '재설정 링크는 60분 동안 유효합니다.',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 12px;">비밀번호 재설정 안내</h2>
          <p>비밀번호 재설정 요청을 확인했습니다.</p>
          <p>아래 버튼을 눌러 비밀번호를 변경해주세요.</p>
          <p style="margin: 20px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px;">
              비밀번호 변경하기
            </a>
          </p>
          <p><strong>인증 코드:</strong> ${token}</p>
          <p style="font-size: 13px; color: #6b7280;">인증 코드는 3분 동안 유효합니다.</p>
        </div>
      `,
    });
  }

  /**
   * 4. 기능 - 비밀번호 초기화
   */
  @Transactional()
  async resetPassword({
    token, // This is now the JWT
    password,
  }: ResetPasswordDto) {
    const payload = await verifyEmailToken(token);
    if (!payload) {
      throw new ErrorException('INVALID_VERIFICATION_TOKEN', HttpStatus.BAD_REQUEST);
    }

    const verification = await this.verificationRepo.findLast({
      identifier: payload.email,
    });
    if (!verification?.value) {
      throw new ErrorException('VERIFICATION_NOT_FOUND', HttpStatus.BAD_REQUEST);
    }

    const { valid } = await verify({
      token: payload.token,
      secret: verification.value,
      epochTolerance: [30 * 60, 0],
    });
    if (!valid) {
      throw new ErrorException(
        'INVALID_VERIFICATION_TOKEN',
        HttpStatus.BAD_REQUEST,
      );
    }

    verification.verifiedAt = new Date();
    await this.accountRepo.nativeUpdate(
      { accountId: payload.email, providerId: ProviderType.CREDENTIAL },
      { password: bcrypt.hashSync(password, 10), failCount: 0 },
    );
  }
}
