import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericArrayResponse, ApiGenericResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { OrganizationType, RoleType } from '@/entities';

import { TenantResponseDto, UpdateTenantDto } from './dto/tenant.dto';
import { TenantService } from './tenant.service';

@ApiTags('Platform Tenant')
@Controller('platform/tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @ApiOperation({ summary: '테넌트(비즈니스 조직) 목록 조회' })
  @ApiGenericArrayResponse(TenantResponseDto)
  @Get()
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async findAll() {
    const tenants = await this.tenantService.findAll();
    return ApiResponse.ok(tenants);
  }

  @ApiOperation({ summary: '테넌트 상세 정보 조회' })
  @ApiGenericResponse(TenantResponseDto)
  @Get(':id')
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async findOne(@Param('id') id: string) {
    const tenant = await this.tenantService.findOne(id);
    return ApiResponse.ok(tenant);
  }

  @ApiOperation({ summary: '테넌트 정보 수정' })
  @ApiGenericResponse(TenantResponseDto)
  @Patch(':id')
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN])
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const tenant = await this.tenantService.update(id, dto);
    return ApiResponse.ok(tenant);
  }
}
