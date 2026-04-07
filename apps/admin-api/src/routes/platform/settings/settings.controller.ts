import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { OrganizationType, RoleType } from '@/entities';

import { UpdatePlatformSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Platform Settings')
@Controller('platform/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @ApiOperation({ summary: '플랫폼 설정 조회' })
  @ApiGenericResponse('ok')
  @Get()
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN])
  async findOne() {
    const settings = await this.settingsService.findOne();
    return ApiResponse.ok(settings);
  }

  @ApiOperation({ summary: '플랫폼 설정 수정' })
  @ApiGenericResponse('ok')
  @Patch()
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN])
  async update(@Body() dto: UpdatePlatformSettingsDto) {
    const settings = await this.settingsService.update(dto);
    return ApiResponse.ok(settings);
  }
}
