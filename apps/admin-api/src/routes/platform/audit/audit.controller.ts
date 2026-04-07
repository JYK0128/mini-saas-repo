import { Controller, Get, Query, Session } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SessionData } from 'express-session';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiGenericResponse } from '@/common/decorators/swagger.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { OrganizationType, RoleType } from '@/entities';

import { AuditService } from './audit.service';
import { AuditListResponseDto, AuditSearchDto } from './dto/audit.dto';

@ApiTags('Platform Audit')
@Controller('platform/audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({ summary: '감사 로그 조회' })
  @ApiGenericResponse(AuditListResponseDto)
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN])
  @Get()
  async findAll(
    @Query() dto: AuditSearchDto,
    @Session() session: SessionData,
  ) {
    // RuleGuard guarantees session.user and membership
    const user = session.user;
    const org = user.member!.organization;

    const res = await this.auditService.findAll(dto, {
      id: org.id,
      type: org.metadata.type,
    });

    return ApiResponse.ok(res);
  }
}
