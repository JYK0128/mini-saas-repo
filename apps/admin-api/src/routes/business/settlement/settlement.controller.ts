import { Controller, Get, HttpStatus, Session } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SessionData } from 'express-session';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericArrayResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { ErrorException } from '@/common/exceptions/error.exception';
import { OrganizationType, RoleType } from '@/entities';

import { ServiceSettlementResponseDto } from './dto/settlement.dto';
import { SettlementService } from './settlement.service';

@ApiTags('Service Settlement')
@Controller('service/settlement')
export class ServiceSettlementController {
  constructor(private readonly settlementService: SettlementService) { }

  @ApiOperation({ summary: '본인 서비스 정산 내역 조회' })
  @ApiGenericArrayResponse(ServiceSettlementResponseDto)
  @Get()
  @Rule(OrganizationType.BUSINESS, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async findAll(@Session() session: SessionData) {
    const organizationId = session.user?.member?.organization.id;
    if (!organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const settlements = await this.settlementService.findAll(organizationId);
    return ApiResponse.ok(settlements);
  }
}
