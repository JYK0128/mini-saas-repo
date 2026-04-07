import { EntityManager } from '@mikro-orm/core';
import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { type Request } from 'express';
import { catchError, mergeMap, throwError } from 'rxjs';

@Injectable()
export class DatabaseInterceptor implements NestInterceptor {
  constructor(private readonly em: EntityManager) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    console.log(`[DB] Interceptor IN: ${request.method} ${request.url}`);
    return next.handle().pipe(
      mergeMap(async (data: unknown) => {
        console.log('[DB] Interceptor OUT (Success)');
        await this.em.flush();
        return data;
      }),
      catchError((error: unknown) => {
        console.log('[DB] Interceptor OUT (Fail)');
        this.em.clear();
        return throwError(() => error);
      }),
    );
  }
}
