import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Query, Session } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SessionData } from 'express-session';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericArrayResponse, ApiGenericResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { ErrorException } from '@/common/exceptions/error.exception';
import { Invitation, OrganizationType, RoleType } from '@/entities';

import { TermResponseDto } from '../terms/dto/terms.dto';
import { InviteStaffDto, StaffResponseDto, UpdateStaffDto } from './dto/staff.dto';
import { StaffService } from './staff.service';

@ApiTags('Service Staff')
@Controller('service/staff')
export class ServiceStaffController {
  constructor(private readonly staffService: StaffService) {}

  @ApiOperation({ summary: '스태프 목록 조회' })
  @ApiGenericArrayResponse(StaffResponseDto)
  @Get()
  @Rule(OrganizationType.BUSINESS, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
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
  @Rule(OrganizationType.BUSINESS, [RoleType.OWNER, RoleType.ADMIN, RoleType.MEMBER])
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
  @Rule(OrganizationType.BUSINESS, RoleType.OWNER)
  async invite(@Session() session: SessionData, @Body() dto: InviteStaffDto) {
    const organizationId = session.user?.member?.organization.id;
    const inviterId = session.user?.id;
    if (!organizationId || !inviterId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    const invitation = await this.staffService.invite(organizationId, inviterId, dto);
    return ApiResponse.ok(invitation);
  }

  @ApiOperation({ summary: '초대장 정보 조회' })
  @ApiGenericResponse(Invitation)
  @Get('invite')
  async getInvitation(@Query('token') token: string) {
    const invitation = await this.staffService.findInvitation(token);
    return ApiResponse.ok(invitation);
  }

  @ApiOperation({ summary: '초대 대상 조직의 약관 목록 조회' })
  @ApiGenericArrayResponse(TermResponseDto)
  @Get('invite/terms')
  async getInvitationTerms(@Query('token') token: string) {
    const terms = await this.staffService.findInvitationTerms(token);
    return ApiResponse.ok(terms);
  }

  @ApiOperation({ summary: '초대 수락' })
  @ApiGenericResponse(StaffResponseDto)
  @Post('invite/accept')
  async acceptInvite(
    @Session() session: SessionData,
    @Query('token') token: string,
  ) {
    const userId = session.user?.id;
    if (!userId) {
      throw new ErrorException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }
    const member = await this.staffService.acceptInvite(token, userId);
    return ApiResponse.ok(member);
  }

  @ApiOperation({ summary: '초대 거절' })
  @ApiGenericResponse('ok')
  @Post('invite/reject')
  async rejectInvite(@Query('token') token: string) {
    await this.staffService.rejectInvite(token);
    return ApiResponse.ok('ok');
  }

  @ApiOperation({ summary: '스태프 역할 수정' })
  @ApiGenericResponse(StaffResponseDto)
  @Patch(':id')
  @Rule(OrganizationType.BUSINESS, RoleType.OWNER)
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
  @Rule(OrganizationType.BUSINESS, RoleType.OWNER)
  async remove(@Session() session: SessionData, @Param('id') id: string) {
    const organizationId = session.user?.member?.organization.id;
    const actorUserId = session.user?.id;
    if (!organizationId) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    if (!actorUserId) {
      throw new ErrorException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }
    await this.staffService.remove(organizationId, id, actorUserId);
    return ApiResponse.ok('ok');
  }
}
