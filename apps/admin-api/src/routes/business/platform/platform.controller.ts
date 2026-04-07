import { Controller, Get, Session } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SessionData } from 'express-session';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { OrganizationType, RoleType } from '@/entities';

import { PlatformPolicyResponseDto, PlatformStatusResponseDto } from './dto/platform.dto';
import { PlatformService } from './platform.service';

@ApiTags('Service Platform')
@Controller('service/platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @ApiOperation({ summary: '플랫폼 이용 현황 조회' })
  @ApiGenericResponse(PlatformStatusResponseDto)
  @Get('status')
  @Rule(OrganizationType.BUSINESS, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async getStatus(@Session() session: SessionData) {
    const organizationId = session.user.member!.organization.id;
    const status = await this.platformService.getStatus(organizationId);
    return ApiResponse.ok(status);
  }

  @ApiOperation({ summary: '플랫폼 이용 정책 조회' })
  @ApiGenericResponse(PlatformPolicyResponseDto)
  @Get('policy')
  @Rule(OrganizationType.BUSINESS, [RoleType.OWNER])
  async getPolicy(@Session() session: SessionData) {
    const organizationId = session.user.member!.organization.id;
    const policy = await this.platformService.getPolicy(organizationId);
    return ApiResponse.ok(policy);
  }
}
