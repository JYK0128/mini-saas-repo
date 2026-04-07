import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { RULE_KEY, type RuleMetadata } from '@/common/decorators/rule.decorator';
import { ErrorException } from '@/common/exceptions/error.exception';

@Injectable()
export class RuleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext) {
    const rule = this.reflector.getAllAndOverride<RuleMetadata>(RULE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!rule) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const session = request.session;
    const { user } = session;
    if (!user || !user.member || !user.member.organization) {
      return true;
    }

    const { member } = user;
    const { organization, role } = member;
    const roleScope = organization.metadata?.type;

    if (!roleScope) {
      throw new ErrorException('ORGANIZATION_METADATA_MISSING', HttpStatus.FORBIDDEN);
    }

    const isScopeMatched = Array.isArray(rule.scope)
      ? rule.scope.includes(roleScope)
      : roleScope === rule.scope;

    if (!isScopeMatched || !rule.roles.includes(role)) {
      throw new ErrorException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
