import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { OrganizationType, RoleType } from '@/entities';

import { CreatePlanDto } from './dto/pricing.dto';
import { PricingService } from './pricing.service';

@ApiTags('Platform Pricing')
@Controller('platform/pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) { }

  @ApiOperation({ summary: '플랫폼 요금제 조회' })
  @ApiGenericResponse('ok')
  @Get()
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async findAll() {
    const plans = await this.pricingService.findAll();
    return ApiResponse.ok(plans);
  }

  @ApiOperation({ summary: '플랫폼 요금제 생성' })
  @ApiGenericResponse('ok')
  @Post()
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER])
  async create(@Body() dto: CreatePlanDto) {
    const plan = await this.pricingService.create(dto);
    return ApiResponse.ok(plan);
  }
}
