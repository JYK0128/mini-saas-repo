import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { OrganizationType, RoleType } from '@/entities';

import { CreateSettlementDto } from './dto/settlement.dto';
import { SettlementService } from './settlement.service';

@ApiTags('Platform Settlement')
@Controller('platform/settlement')
export class SettlementController {
  constructor(private readonly settlementService: SettlementService) { }

  @ApiOperation({ summary: '전체 정산 내역 조회' })
  @ApiGenericResponse('ok')
  @Get()
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async findAll() {
    const settlements = await this.settlementService.findAll();
    return ApiResponse.ok(settlements);
  }

  @ApiOperation({ summary: '정산 요청 생성' })
  @ApiGenericResponse('ok')
  @Post()
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER])
  async create(@Body() dto: CreateSettlementDto) {
    const settlement = await this.settlementService.create(dto);
    return ApiResponse.ok(settlement);
  }
}
