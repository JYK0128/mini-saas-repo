import { randomUUID } from 'node:crypto';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import type { SessionData } from 'express-session';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class ContextMiddleware implements NestMiddleware {
  constructor(
    private readonly cls: ClsService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.cls.set('requestId', randomUUID());
    this.cls.set('session', req.session as SessionData);
    next();
  }
}
