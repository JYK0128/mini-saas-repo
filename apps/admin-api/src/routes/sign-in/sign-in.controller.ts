import { Body, Controller, Get, HttpStatus, Post, Res, Session } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Session as ExpressSession, type SessionData } from 'express-session';
import { omit } from 'lodash-es';

import { ApiGenericArrayResponse, ApiGenericResponse, Bypass, Public } from '@/common/decorators';
import { ApiResponse } from '@/common/dto/response.dto';
import { ErrorException } from '@/common/exceptions/error.exception';

import { CreateOrganizationDto, FindIdDto, FindIdResponseDto, FindPasswordDto, LoginDto, LoginResponseDto, ResetPasswordDto, SetNewAgreementsDto, SignInNewAgreementResponseDto } from './dto';
import { SignInService } from './sign-in.service';

@ApiTags('Sign-In')
@Controller('sign-in')
export class SignInController {
  constructor(private readonly signInService: SignInService) { }

  @ApiOperation({ summary: '로그인 - 로그인' })
  @ApiGenericResponse(LoginResponseDto)
  @Public()
  @Post('login')
  async signIn(
    @Body() dto: LoginDto,
    @Session() session: SessionData,
  ) {
    const user = await this.signInService.validateUser(dto);
    session.user = user;

    const userData = omit(user, ['account']);
    return ApiResponse.ok(userData);
  }

  @ApiOperation({ summary: '로그인 - 로그아웃' })
  @ApiGenericResponse(true)
  @Public()
  @Post('logout')
  async signOut(
    @Session() session: ExpressSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    await new Promise<void>((resolve, reject) => {
      session.destroy((error) => {
        if (!error) resolve();
        reject(new ErrorException('INTERNAL_SERVER_ERROR', HttpStatus.INTERNAL_SERVER_ERROR));
      });
    });
    res.clearCookie('connect.sid', { httpOnly: true, path: '/' });
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '로그인 추가기능 - 신규가입 대상 최초 로그인 시 조직 생성' })
  @ApiGenericResponse(true)
  @Bypass('member', 'organization')
  @Post('organization')
  async createOrganization(
    @Body() dto: CreateOrganizationDto,
    @Session() session: SessionData,
  ) {
    await this.signInService.createOrganization(session.user, dto);
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '약관 재동의 - 미동의 약관 조회' })
  @ApiGenericArrayResponse(SignInNewAgreementResponseDto)
  @Bypass('needsTermAgreement')
  @Get('new-agreements')
  async getNewAgreements(
    @Session() session: SessionData,
  ) {
    const terms = await this.signInService.getNewAgreements(session.user);
    return ApiResponse.ok(terms);
  }

  @ApiOperation({ summary: '약관 재동의 - 미동의 약관 동의' })
  @ApiGenericResponse(true)
  @Bypass('needsTermAgreement')
  @Post('agree-terms')
  async setNewAgreements(
    @Body() dto: SetNewAgreementsDto,
    @Session() session: SessionData,
  ) {
    await this.signInService.setNewAgreements(session.user, dto);
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '기능 - 아이디 찾기' })
  @ApiGenericResponse(FindIdResponseDto)
  @Public()
  @Post('find/id')
  async findId(
    @Body() dto: FindIdDto,
  ) {
    const res = await this.signInService.forgetId(dto);
    return ApiResponse.ok(res);
  }

  @ApiOperation({ summary: '기능 - 비밀번호 찾기' })
  @ApiGenericResponse(true)
  @Public()
  @Post('find/password')
  async findPassword(
    @Body() dto: FindPasswordDto,
  ) {
    await this.signInService.forgetPassword(dto);
    return ApiResponse.ok(true);
  }

  @ApiOperation({ summary: '기능 - 비밀번호 초기화' })
  @ApiGenericResponse(true)
  @Public()
  @Post('reset/password')
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ) {
    await this.signInService.resetPassword(dto);
    return ApiResponse.ok(true);
  }
}
