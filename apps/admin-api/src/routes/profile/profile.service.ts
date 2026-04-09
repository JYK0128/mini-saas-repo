import path from 'node:path';

import { InjectRepository } from '@mikro-orm/nestjs';
import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import { generateSecret, verify } from 'otplib';

import { ErrorException } from '@/common/exceptions/error.exception';
import { AccountRepository, ProviderType, TermAgreementRepository, TermRepository, User, UserRepository } from '@/entities';

import type { ChangePasswordDto, Enable2FADto, TermAgreementDto, TermWithdrawalDto, UpdateProfileDto } from './dto';

const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const PROFILE_IMAGE_PREFIX = '/uploads/profile/';

@Injectable()
export class ProfileService {
  constructor(
    private readonly termRepo: TermRepository,
    private readonly accountRepo: AccountRepository,
    private readonly termAgreementRepo: TermAgreementRepository,
    @InjectRepository(User)
    private readonly userRepo: UserRepository,
  ) {}

  /**
   * 본인 프로파일 수정
   */
  async updateProfile(user: User, dto: UpdateProfileDto) {
    if (dto.name !== undefined) {
      user.name = dto.name;
    }
    if (dto.image !== undefined) {
      user.image = dto.image;
    }
    return Promise.resolve();
  }

  /**
   * 파일 디스크 삭제
   */
  private async removeUploadedFile(
    filePath: string,
  ) {
    try {
      await fs.unlink(filePath);
    }
    catch {
      throw new ErrorException('FILE_NOT_DELETED', HttpStatus.CONFLICT);
    }
  }

  /**
   * 프로파일 업로드
   */
  async uploadProfileImage(
    user: User,
    file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new ErrorException('FILE_REQUIRED', HttpStatus.BAD_REQUEST);
    }

    const fileExt = path.extname(file.originalname).toLowerCase();
    if (
      !ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)
      || !ALLOWED_IMAGE_EXTENSIONS.has(fileExt)
    ) {
      await this.removeUploadedFile(file.path);
      throw new ErrorException('INVALID_IMAGE_TYPE', HttpStatus.BAD_REQUEST);
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      await this.removeUploadedFile(file.path);
      throw new ErrorException('FILE_TOO_LARGE', HttpStatus.PAYLOAD_TOO_LARGE);
    }

    const previousImage = user.image;
    if (previousImage && previousImage.startsWith(PROFILE_IMAGE_PREFIX)) {
      const fileName = previousImage.replace(PROFILE_IMAGE_PREFIX, '');
      const filePath = path.join(process.cwd(), 'uploads', 'profile', fileName);
      await this.removeUploadedFile(filePath).catch(() => {});
    }

    const imgPath = `${PROFILE_IMAGE_PREFIX}${file.filename}`;
    user.image = imgPath;
  }

  /**
   * 패스워드 변경
   */
  async changePassword(user: User, {
    currentPassword,
    newPassword,
    confirmPassword,
  }: ChangePasswordDto) {
    const account = user.account;
    if (!user.account || !account?.password) {
      throw new ErrorException('Password change is not available for this account', HttpStatus.BAD_REQUEST);
    }

    if (newPassword !== confirmPassword) {
      throw new ErrorException('비밀번호 확인 불일치', HttpStatus.BAD_REQUEST);
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, account.password);
    if (!isCurrentPasswordValid) {
      throw new ErrorException('Current password is incorrect', HttpStatus.UNAUTHORIZED);
    }

    const isSamePassword = await bcrypt.compare(newPassword, account.password);
    if (isSamePassword) {
      throw new ErrorException('New password must be different from current password', HttpStatus.BAD_REQUEST);
    }

    await this.accountRepo.nativeUpdate(
      { accountId: account.accountId, providerId: ProviderType.CREDENTIAL },
      { password: bcrypt.hashSync(newPassword, 10), failCount: 0 },
    );
  }

  /**
   * 2FA 시크릿 생성
   */
  async generate2FASecret(
    user: User,
  ) {
    const secret = generateSecret();
    const label = encodeURIComponent(user.email);
    const issuer = encodeURIComponent('Admin-API');
    const url = `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}`;

    return Promise.resolve({ secret, url });
  }

  /**
   * 2FA 활성화
   */
  async verifyAndEnable2FA(
    user: User, {
      token,
      secret,
    }: Enable2FADto) {
    const { valid } = await verify({ token, secret });
    if (!valid) {
      throw new UnauthorizedException('Invalid OTP token');
    }
    user.twoFactorSecret = secret;
    return { twoFactorSecret: secret, twoFactorEnabled: valid };
  }

  /**
   * 약관 히스토리 조회
   */
  async getAgreementsHistory(
    user: User,
  ) {
    return this.termAgreementRepo.findAgreementsHistory(user);
  }

  /**
   * 약관 현황 조회
   */
  async getActiveAgreements(
    user: User,
  ) {
    return this.termAgreementRepo.findActiveAgreementsByUser(user);
  }

  /**
   * 약관 동의
   */
  async agreeToTerms(
    user: User,
    {
      termIds,
    }: TermAgreementDto,
  ) {
    for (const termId of termIds) {
      await this.termAgreementRepo.createTermAgreement(
        user,
        this.termRepo.getReference(termId),
      );
    }
  }

  /**
   * 약관 철회
   */
  async withdrawAgreement(
    user: User,
    {
      agreementId,
    }: TermWithdrawalDto,
  ) {
    const agreement = await this.termAgreementRepo.findOne({
      id: agreementId,
      user: { id: user.id },
    },
    { populate: ['term'] });

    if (!agreement) {
      throw new ErrorException('AGREEMENT_NOT_FOUND', HttpStatus.BAD_REQUEST);
    }
    agreement.softDelete();
  }
}
