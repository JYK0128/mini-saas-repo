import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Session } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SessionData } from 'express-session';

import { ApiGenericArrayResponse, ApiGenericResponse, Bypass, Rule } from '@/common/decorators';
import { ApiResponse } from '@/common/dto/response.dto';
import { ErrorException } from '@/common/exceptions/error.exception';
import { OrganizationType, RoleType } from '@/entities';

import { CreateTermDto, TermResponseDto, UpdateTermDto } from './dto';
import { TermsService } from './terms.service';

@ApiTags('Service Terms')
@Controller('service/terms')
export class ServiceTermsController {
  constructor(private readonly termsService: TermsService) { }

  @ApiOperation({ summary: '약관 목록 조회' })
  @ApiGenericArrayResponse(TermResponseDto)
  @Get()
  @Bypass('needsTermAgreement')
  @Rule([OrganizationType.BUSINESS, OrganizationType.PLATFORM], [RoleType.OWNER, RoleType.ADMIN])
  async findAll(@Session() session: SessionData) {
    const isPlatform = session.user?.member?.organization.metadata.type === OrganizationType.PLATFORM;
    const organizationId = isPlatform ? undefined : session.user?.member?.organization.id;
    if (!isPlatform && !organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const terms = await this.termsService.findAll(organizationId);
    return ApiResponse.ok(terms);
  }

  @ApiOperation({ summary: '새 약관 등록' })
  @ApiGenericResponse(TermResponseDto)
  @Post()
  @Rule([OrganizationType.BUSINESS, OrganizationType.PLATFORM], [RoleType.OWNER, RoleType.ADMIN])
  async create(@Session() session: SessionData, @Body() dto: CreateTermDto) {
    const isPlatform = session.user?.member?.organization.metadata.type === OrganizationType.PLATFORM;
    const organizationId = isPlatform ? undefined : session.user?.member?.organization.id;
    if (!isPlatform && !organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const term = await this.termsService.create(organizationId, dto);
    return ApiResponse.ok(term);
  }

  @ApiOperation({ summary: '약관 수정' })
  @ApiGenericResponse(TermResponseDto)
  @Patch(':id')
  @Rule([OrganizationType.BUSINESS, OrganizationType.PLATFORM], [RoleType.OWNER, RoleType.ADMIN])
  async update(
    @Session() session: SessionData,
    @Param('id') termId: string,
    @Body() dto: UpdateTermDto,
  ) {
    const isPlatform = session.user?.member?.organization.metadata.type === OrganizationType.PLATFORM;
    const organizationId = isPlatform ? undefined : session.user?.member?.organization.id;
    if (!isPlatform && !organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const term = await this.termsService.update(organizationId, termId, dto);
    return ApiResponse.ok(term);
  }
}
