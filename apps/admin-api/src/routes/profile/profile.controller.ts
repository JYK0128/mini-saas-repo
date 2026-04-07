import { Body, Controller, Get, Patch, Post, Session, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SessionData } from 'express-session';
import { omit } from 'lodash-es';

import { ApiGenericArrayResponse, ApiGenericResponse, Rule } from '@/common/decorators';
import { ApiResponse } from '@/common/dto/response.dto';
import { ProfileImageInterceptor } from '@/common/interceptors/file.interceptor';
import { OrganizationType, RoleType, TermAgreement, User } from '@/entities';

import { ChangePasswordDto, Enable2FADto, Setup2FAResponseDto, TermAgreementDto, TermAgreementResponseDto, TermWithdrawalDto, UpdateProfileDto } from './dto';
import { ProfileService } from './profile.service';

@ApiTags('User Profile')
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiOperation({ summary: '본인 프로필 조회' })
  @ApiGenericResponse(User)
  @Get()
  @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async getProfile(@Session() session: SessionData) {
    const userData = omit(
      session.user,
      ['account'],
    );
    return ApiResponse.ok(userData);
  }

  @ApiOperation({ summary: '본인 프로필 수정' })
  @ApiGenericResponse(true)
  @Patch()
  @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async updateProfile(@Session() session: SessionData, @Body() dto: UpdateProfileDto) {
    await this.profileService.updateProfile(session.user, dto);
    // 세션 동기화
    if (dto.name !== undefined) {
      session.user.name = dto.name;
    }
    if (dto.image !== undefined) {
      session.user.image = dto.image;
    }
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '프로필 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiGenericResponse(true)
  @Post('image')
  @UseInterceptors(ProfileImageInterceptor())
  @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async uploadProfileImage(
    @Session() session: SessionData,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const res = await this.profileService.uploadProfileImage(session.user, file);
    // 세션 동기화
    session.user.image = res.image;
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '비밀번호 변경' })
  @ApiGenericResponse(true)
  @Patch('password')
  @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async changePassword(@Session() session: SessionData, @Body() dto: ChangePasswordDto) {
    const user = session.user;
    await this.profileService.changePassword(user, dto);
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '2단계 인증(2FA) 비밀키 및 QR URL 생성' })
  @ApiGenericResponse(Setup2FAResponseDto)
  @Post('2fa/setup')
  @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async setup2FA(@Session() session: SessionData) {
    const res = await this.profileService.generate2FASecret(session.user);
    return ApiResponse.ok(res);
  }

  @ApiOperation({ summary: '2단계 인증(2FA) 검증 및 활성화' })
  @ApiGenericResponse(true)
  @Post('2fa/enable')
  @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async enable2FA(@Session() session: SessionData, @Body() dto: Enable2FADto) {
    const res = await this.profileService.verifyAndEnable2FA(session.user, dto);
    session.user.twoFactorSecret = res.twoFactorSecret;
    session.user.twoFactorEnabled = res.twoFactorEnabled;
    session.twoFactorPending = false;
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '2단계 인증(2FA) 비활성화' })
  @ApiGenericResponse(true)
  @Post('2fa/disable')
  @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async disable2FA(@Session() session: SessionData) {
    session.user.twoFactorEnabled = false;
    session.user.twoFactorSecret = undefined;
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '약관 히스토리 조회' })
  @ApiGenericArrayResponse(TermAgreement)
  @Get('agreements/history')
  @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async getAgreementsHistory(@Session() session: SessionData) {
    const res = await this.profileService.getAgreementsHistory(session.user);
    return ApiResponse.ok(res);
  }

  @ApiOperation({ summary: '약관 현황 조회' })
  @ApiGenericArrayResponse(TermAgreementResponseDto)
  @Get('agreements')
  @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async getAgreements(@Session() session: SessionData) {
    const res = await this.profileService.getActiveAgreements(session.user);
    return ApiResponse.ok(res);
  }

  @ApiOperation({ summary: '약관 동의' })
  @ApiGenericResponse(true)
  @Post('agreements')
  @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async agreeToTerms(@Session() session: SessionData, @Body() dto: TermAgreementDto) {
    await this.profileService.agreeToTerms(session.user, dto);
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '약관 동의 철회' })
  @ApiGenericResponse(true)
  @Post('agreements/withdraw')
  @Rule([OrganizationType.PLATFORM, OrganizationType.BUSINESS], [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async withdrawAgreement(@Session() session: SessionData, @Body() dto: TermWithdrawalDto) {
    await this.profileService.withdrawAgreement(session.user, dto);
    return ApiResponse.ok(true);
  }
}
