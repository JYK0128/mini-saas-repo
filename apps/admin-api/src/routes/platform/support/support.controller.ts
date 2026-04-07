import { Body, Controller, Post, Session, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { type SessionData } from 'express-session';

import { Rule } from '@/common/decorators/rule.decorator';
import { ApiResponse } from '@/common/dto/response.dto';
import { OrganizationType, RoleType, UserRepository } from '@/entities';

@ApiTags('Platform Support')
@Controller('platform/support')
export class SupportController {
  constructor(private readonly userRepo: UserRepository) {}

  @ApiOperation({ summary: '테넌트 사용자 대리 로그인 (Impersonation)' })
  @Post('impersonate')
  @Rule(OrganizationType.PLATFORM, RoleType.OWNER)
  async impersonate(@Session() session: SessionData, @Body() dto: { userId: string }) {
    const adminUser = session.user;
    const targetUser = await this.userRepo.findOneOrFail({ id: dto.userId }, { populate: ['member', 'member.organization'] });

    // Store original admin ID to allow return
    session['impersonatorId'] = adminUser.id;
    session.user = targetUser; // Session now reflects the target user

    return ApiResponse.ok(`Impersonating ${targetUser.name}`);
  }

  @ApiOperation({ summary: '대리 로그인 종료' })
  @Post('stop-impersonation')
  async stopImpersonation(@Session() session: SessionData) {
    if (!session['impersonatorId']) {
      throw new UnauthorizedException('Not currently impersonating anyone');
    }

    const originalAdmin = await this.userRepo.findOneOrFail({ id: session['impersonatorId'] as string }, { populate: ['member', 'member.organization'] });
    session.user = originalAdmin;
    delete session['impersonatorId'];

    return ApiResponse.ok('Restored original administrator session');
  }

  @ApiOperation({ summary: '테넌트 데이터 대리 조회 (Read-only)' })
  @Post('delegate-view')
  @Rule(OrganizationType.PLATFORM, [RoleType.OWNER, RoleType.ADMIN])
  async delegateView(@Session() session: SessionData, @Body() dto: { tenantId: string }) {
    // Logic for read-only view of a tenant's dashboard
    // This could involve setting a temporary tenantId in session without full user swap
    return ApiResponse.ok(`Now viewing data for tenant: ${dto.tenantId}`);
  }
}
