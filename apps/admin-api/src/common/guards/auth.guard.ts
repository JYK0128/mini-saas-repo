import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { type AuthCondition, BYPASS_KEY } from '@/common/decorators/bypass.decorator';
import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';
import { ErrorException } from '@/common/exceptions/error.exception';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const bypassConditions = this.reflector.getAllAndOverride<AuthCondition[]>(BYPASS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) || [];

    const request = context.switchToHttp().getRequest<Request>();
    const session = request.session;

    if (!session.user) {
      throw new ErrorException('UNAUTHORIZED', HttpStatus.UNAUTHORIZED);
    }
    if (session.twoFactorPending && !bypassConditions.includes('twoFactorPending')) {
      throw new ErrorException('TWO_FACTOR_PENDING', HttpStatus.UNAUTHORIZED);
    }
    if (session.needsTermAgreement && !bypassConditions.includes('needsTermAgreement')) {
      throw new ErrorException('NEEDS_TERM_AGREEMENT', HttpStatus.FORBIDDEN);
    }

    const user = session.user;
    if (!user.emailVerified && !bypassConditions.includes('emailVerified')) {
      throw new ErrorException('EMAIL_NOT_VERIFIED', HttpStatus.FORBIDDEN, { email: user.email });
    }

    const member = user?.member;
    if (!member && !bypassConditions.includes('member')) {
      throw new ErrorException('MEMBER_NOT_FOUND', HttpStatus.FORBIDDEN);
    }
    if (member?.deletedAt) {
      throw new ErrorException('MEMBER_NOT_FOUND', HttpStatus.FORBIDDEN);
    }

    const organization = member?.organization;
    if (!organization && !bypassConditions.includes('organization')) {
      throw new ErrorException('ORGANIZATION_NOT_FOUND', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
