import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import session from 'express-session';

import { SessionStore } from '../tools/SessionStore';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  private readonly sessionHandler: (req: Request, res: Response, next: NextFunction) => void;

  constructor(
    private readonly sessionStore: SessionStore,
  ) {
    this.sessionHandler = session({
      secret: process.env.SESSION_SECRET || 'SUPER-SECRET-KEY',
      saveUninitialized: false,
      resave: false,
      rolling: true,
      store: this.sessionStore,
      cookie: {
        maxAge: 1000 * 60 * 60,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      },
    });
  }

  use(req: Request, res: Response, next: NextFunction) {
    this.sessionHandler(req, res, next);
  }
}
