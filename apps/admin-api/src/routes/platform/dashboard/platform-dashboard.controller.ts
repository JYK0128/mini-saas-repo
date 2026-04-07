import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { OrganizationType, RoleType } from '@/entities';

import { DashboardService } from './dashboard.service';
import { PlatformStatsDto } from './dto/dashboard.dto';

@ApiTags('Platform Dashboard')
@Controller('platform/dashboard')
export class PlatformDashboardController {
  constructor(private readonly dashboardService: DashboardService) { }

  @ApiOperation({ summary: '플랫폼 통합 대시보드 조회' })
  @ApiGenericResponse(PlatformStatsDto)
  @Get()
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async getStats() {
    const stats = await this.dashboardService.getPlatformStats();
    return ApiResponse.ok(stats);
  }
}
