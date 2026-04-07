import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Session } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SessionData } from 'express-session';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericArrayResponse, ApiGenericResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { ErrorException } from '@/common/exceptions/error.exception';
import { OrganizationType, RoleType } from '@/entities';

import { InviteStaffDto, StaffResponseDto, UpdateStaffDto } from './dto/staff.dto';
import { StaffService } from './staff.service';

@ApiTags('Platform Staff')
@Controller('platform/staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @ApiOperation({ summary: '스태프 목록 조회' })
  @ApiGenericArrayResponse(StaffResponseDto)
  @Get()
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async findAll(@Session() session: SessionData) {
    const organizationId = session.user?.member?.organization.id;
    if (!organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const staff = await this.staffService.findAll(organizationId);
    return ApiResponse.ok(staff);
  }

  @ApiOperation({ summary: '스태프 상세 조회' })
  @ApiGenericResponse(StaffResponseDto)
  @Get(':id')
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
  async findOne(@Session() session: SessionData, @Param('id') id: string) {
    const organizationId = session.user?.member?.organization.id;
    if (!organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const member = await this.staffService.findOne(organizationId, id);
    return ApiResponse.ok(member);
  }

  @ApiOperation({ summary: '스태프 초대/추가' })
  @ApiGenericResponse(StaffResponseDto)
  @Post()
  @Rule(OrganizationType.PLATFORM, RoleType.OWNER)
  async invite(@Session() session: SessionData, @Body() dto: InviteStaffDto) {
    const organizationId = session.user?.member?.organization.id;
    if (!organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const member = await this.staffService.invite(organizationId, dto);
    return ApiResponse.ok(member);
  }

  @ApiOperation({ summary: '스태프 역할 수정' })
  @ApiGenericResponse(StaffResponseDto)
  @Patch(':id')
  @Rule(OrganizationType.PLATFORM, RoleType.OWNER)
  async update(
    @Session() session: SessionData,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    const organizationId = session.user?.member?.organization.id;
    if (!organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const member = await this.staffService.update(organizationId, id, dto);
    return ApiResponse.ok(member);
  }

  @ApiOperation({ summary: '스태프 삭제/추방' })
  @ApiGenericResponse('ok')
  @Delete(':id')
  @Rule(OrganizationType.PLATFORM, RoleType.OWNER)
  async remove(@Session() session: SessionData, @Param('id') id: string) {
    const organizationId = session.user?.member?.organization.id;
    if (!organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    await this.staffService.remove(organizationId, id);
    return ApiResponse.ok('ok');
  }
}
