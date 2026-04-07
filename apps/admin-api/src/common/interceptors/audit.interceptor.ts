import { EntityManager } from '@mikro-orm/core';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import type { SessionData } from 'express-session';
import { ClsService } from 'nestjs-cls';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { Audit } from '@/entities';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  // 로그 마스킹 처리가 필요한 필드 목록
  private readonly maskFields = ['password', 'accessToken', 'refreshToken', 'token'];

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    // get start time
    const startTime = Date.now();

    // get user info
    const { user } = request.session as SessionData;
    const userId = user?.id || 'anonymous';
    const organizationId = user?.member?.organization.id;

    // get referer
    const referer = request.headers.referer || request.headers.referrer as string;

    // request log start
    console.log(`[Audit] Interceptor IN: ${request.method} ${request.url} from ${referer || 'unknown'}`);

    // request log end
    return next.handle().pipe(
      tap((data: unknown) => {
        console.log('[Audit] Interceptor OUT (Success)');
        this.log(request, response, referer, startTime, userId, organizationId, data, null);
      }),
      catchError((error: unknown) => {
        console.log('[Audit] Interceptor OUT (Fail)');
        this.log(request, response, referer, startTime, userId, organizationId, null, error);
        return throwError(() => error);
      }),
    );
  }

  private log(
    request: Request,
    response: Response,
    referer: string,
    startTime: number,
    userId: string,
    organizationId: string | undefined,
    data?: unknown,
    error?: unknown,
  ) {
    const duration = Date.now() - startTime;
    const maskedPayload = this.maskSensitiveData(request.body as unknown);
    const maskedResponse = this.maskSensitiveData(data);

    let errorMessage: string | undefined;
    if (error instanceof Error) {
      errorMessage = error.stack;
    }
    else if (error) {
      errorMessage = JSON.stringify(error);
    }
    // 2. DB Save (비동기 수행)
    this.em.create(Audit, {
      id: request['requestId'] as string,
      userId: userId !== 'anonymous' ? userId : undefined,
      organizationId,
      url: request.url,
      method: request.method,
      statusCode: response.statusCode,
      duration,
      ip: request.ip,
      userAgent: request.headers['user-agent'] as string,
      referer,
      payload: maskedPayload,
      responseData: maskedResponse,
      error: errorMessage,
    }).persist().flush();
  }

  private maskSensitiveData<T>(data: T): T {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return data;

    const masked = { ...(data as Record<string, unknown>) } as T;
    const maskedObj = masked as Record<string, unknown>;
    for (const field of this.maskFields) {
      if (field in maskedObj) {
        maskedObj[field] = '********';
      }
    }
    return masked;
  }
}
