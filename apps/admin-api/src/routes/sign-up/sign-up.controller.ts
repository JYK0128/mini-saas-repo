import { Body, Controller, Get, HttpStatus, Post, Query, Res, Session } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { type SessionData } from 'express-session';

import { ApiGenericArrayResponse, ApiGenericResponse, Cookie, Public } from '@/common/decorators';
import { ApiResponse } from '@/common/dto/response.dto';
import { ErrorException } from '@/common/exceptions/error.exception';
import { Invitation } from '@/entities';

import { StaffResponseDto } from '../business/staff/dto/staff.dto';
import { CheckEmailConflictDto, ConfirmEmailVerificationDto, ConfirmPhoneVerificationDto, CreateAccountDto, GetTermsDto, GetTermsResponseDto, RequestPhoneVerificationDto, ResendEmailVerificationDto } from './dto';
import { SignUpService } from './sign-up.service';

@ApiTags('Sign-Up')
@Public()
@Controller('sign-up')
export class SignUpController {
  constructor(
    private readonly signUpService: SignUpService,
  ) {}

  @ApiOperation({ summary: '1-1. 약관목록 - 약관목록조회' })
  @ApiGenericArrayResponse(GetTermsResponseDto)
  @Get('terms')
  async getTerms(
    @Query() dto: GetTermsDto,
  ) {
    let email: string | undefined;
    if (dto.token) {
      const invitation = await this.signUpService.getInvitation(dto.token);
      email = invitation.email;
    }

    const terms = await this.signUpService.getTerms(email);
    return ApiResponse.ok(terms);
  }

  @ApiOperation({ summary: '1-2. 회원정보입력 - 이메일 중복 확인' })
  @ApiGenericResponse(true)
  @Post('email/check')
  async checkEmailConflict(
    @Body() dto: CheckEmailConflictDto,
  ) {
    await this.signUpService.checkEmailConflict(dto);
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '1-2. 회원정보입력 - 휴대폰 인증 요청' })
  @ApiGenericResponse(true)
  @Post('phone/request')
  async requestPhoneVerification(
    @Body() dto: RequestPhoneVerificationDto,
  ) {
    await this.signUpService.requestPhoneVerification(dto);
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '1-2. 회원정보입력 - 휴대폰 인증 확인' })
  @ApiGenericResponse(true)
  @Post('phone/confirm')
  async confirmPhoneVerification(
    @Body() dto: ConfirmPhoneVerificationDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = await this.signUpService.confirmPhoneVerification(dto);

    // 인증완료 증빙토큰
    res.cookie('pbt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 60 * 1000,
    });

    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '1-3. 회원가입완료 - 회원가입완료 및 인증메일 발송' })
  @ApiGenericResponse(true)
  @Post('account/create')
  async createAccount(
    @Body() dto: CreateAccountDto,
    @Cookie('pbt') pbt?: string,
  ) {
    if (!pbt) {
      throw new ErrorException('VERIFICATION_TOKEN_NOT_FOUND', HttpStatus.BAD_REQUEST);
    }

    const user = await this.signUpService.createAccount(pbt, dto);
    if (!user.emailVerified) {
      await this.signUpService.requestEmailVerification({ email: dto.email });
    }
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '1-4. 회원검증완료 - 인증메일 확인' })
  @ApiGenericResponse(true)
  @Get('email/confirm')
  async confirmEmailVerification(
    @Query() dto: ConfirmEmailVerificationDto,
  ) {
    await this.signUpService.confirmEmailVerification(dto);
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '1-5. 회원재검증 - 인증메일 재발송' })
  @ApiGenericResponse(true)
  @Post('email/resend')
  async resendEmailVerification(
    @Body() dto: ResendEmailVerificationDto,
  ) {
    await this.signUpService.resendEmailVerification(dto);
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '초대장 정보 조회' })
  @ApiGenericResponse(Invitation)
  @Get('invite')
  async getInvitation(@Query('token') token: string) {
    const invitation = await this.signUpService.getInvitation(token);
    return ApiResponse.ok(invitation);
  }

  @ApiOperation({ summary: '초대 거절' })
  @ApiGenericResponse('ok')
  @Post('invite/reject')
  async rejectInvite(@Query('token') token: string) {
    await this.signUpService.rejectInvite(token);
    return ApiResponse.ok('ok');
  }

  @ApiOperation({ summary: '초대 수락 (기존 회원용)' })
  @ApiGenericResponse(StaffResponseDto)
  @Post('invite/accept')
  async acceptInvite(
    @Session() session: SessionData,
    @Query('token') token: string,
  ) {
    const userId = session.user?.id;
    if (!userId) {
      throw new ErrorException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }
    const member = await this.signUpService.acceptInvite(token, userId);
    return ApiResponse.ok(member);
  }
}
