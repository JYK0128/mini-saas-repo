import { Body, Controller, Get, HttpStatus, Patch, Post, Session, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SessionData } from 'express-session';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { ErrorException } from '@/common/exceptions/error.exception';
import { OrganizationType, RoleType } from '@/entities';

import { LogoUploadResponseDto, ServiceSettingsResponseDto, UpdateServiceSettingsDto } from './dto/settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('Service Settings')
@Controller('service/settings')
export class ServiceSettingsController {
  constructor(private readonly settingsService: SettingsService) { }

  @ApiOperation({ summary: '서비스 설정 조회' })
  @ApiGenericResponse(ServiceSettingsResponseDto)
  @Get()
  @Rule(OrganizationType.BUSINESS, [RoleType.OWNER, RoleType.ADMIN])
  async getOrganization(@Session() session: SessionData) {
    const organization = session.user?.member?.organization;
    if (!organization) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    return ApiResponse.ok(organization);
  }

  @ApiOperation({ summary: '서비스 설정 수정' })
  @ApiGenericResponse(ServiceSettingsResponseDto)
  @Patch()
  @Rule(OrganizationType.BUSINESS, [RoleType.OWNER, RoleType.ADMIN])
  async updateOrganization(@Session() session: SessionData, @Body() dto: UpdateServiceSettingsDto) {
    const organization = session.user?.member?.organization;
    if (!organization) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const settings = await this.settingsService.updateOrganization(organization, dto);
    return ApiResponse.ok(settings);
  }

  @ApiOperation({ summary: '로고 이미지 업로드' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiGenericResponse(LogoUploadResponseDto)
  @Post('logo')
  @UseInterceptors(FileInterceptor('file'))
  @Rule(OrganizationType.BUSINESS, [RoleType.OWNER, RoleType.ADMIN])
  async uploadLogoImage(
    @Session() session: SessionData,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const organization = session.user?.member?.organization;
    if (!organization) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    await this.settingsService.uploadLogoImage(organization, file);
    return ApiResponse.ok(true);
  }
}
