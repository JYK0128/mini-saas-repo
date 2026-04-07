import { type CanActivate, type ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { PERMISSION_KEY } from '@/common/decorators/permission.decorator';
import { ErrorException } from '@/common/exceptions/error.exception';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext) {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const session = request.session;

    // 중복 제거 및 권한 확인
    const sessionPermissions = session.permissions || [];
    const missingPermissions = requiredPermissions.filter((p) => !sessionPermissions.includes(p));
    if (missingPermissions.length > 0) {
      throw new ErrorException('FORBIDDEN', HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
