import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericArrayResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { OrganizationType, RoleType } from '@/entities';

import { ServicePlanResponseDto } from './dto/pricing.dto';
import { PricingService } from './pricing.service';

@ApiTags('Service Pricing')
@Controller('service/pricing')
export class ServicePricingController {
  constructor(private readonly pricingService: PricingService) { }

  @ApiOperation({ summary: '서비스 요금제 조회' })
  @ApiGenericArrayResponse(ServicePlanResponseDto)
  @Get()
  @Rule(OrganizationType.BUSINESS, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async findAll() {
    const plans = await this.pricingService.findAll();
    return ApiResponse.ok(plans);
  }
}
