import { Controller, Get, HttpStatus, Session } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SessionData } from 'express-session';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { ErrorException } from '@/common/exceptions/error.exception';
import { OrganizationType, RoleType } from '@/entities';

import { DashboardService } from './dashboard.service';
import { PlatformUsageDto, ServiceStatsDto } from './dto/dashboard.dto';

@ApiTags('Service Dashboard')
@Controller('service/dashboard')
export class ServiceDashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @ApiOperation({ summary: '서비스 대시보드 조회' })
  @ApiGenericResponse(ServiceStatsDto)
  @Get()
  @Rule(OrganizationType.BUSINESS, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async getStats(@Session() session: SessionData) {
    const organizationId = session.user?.member?.organization.id;
    if (!organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const stats = await this.dashboardService.getServiceStats(organizationId);
    return ApiResponse.ok(stats);
  }

  @ApiOperation({ summary: '플랫폼 이용 현황 조회' })
  @ApiGenericResponse(PlatformUsageDto)
  @Get('usage')
  @Rule(OrganizationType.BUSINESS, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async getUsage(@Session() session: SessionData) {
    const organizationId = session.user?.member?.organization.id;
    if (!organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const usage = this.dashboardService.getPlatformUsageData();
    return ApiResponse.ok(usage);
  }
}
