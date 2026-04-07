import { DriverException, EntityManager } from '@mikro-orm/core';
import { ArgumentsHost, Catch, ExceptionFilter as NestExceptionFilter, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';
import { I18nContext, I18nValidationException } from 'nestjs-i18n';

import { ErrorException } from '@/common/exceptions/error.exception';
import { Audit } from '@/entities';

import { ApiResponse, ErrorDetail } from '../dto/response.dto';

interface I18nValidationError {
  property: string
  constraints?: Record<string, string>
  children?: I18nValidationError[]
}

@Injectable()
@Catch()
export class ExceptionFilter implements NestExceptionFilter {
  constructor(
    private readonly em: EntityManager,
    private readonly cls: ClsService,
  ) {}

  private readonly maskFields = ['password', 'accessToken', 'refreshToken', 'token'];

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorCode = 'UNKNOWN_ERROR';
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    let errorDetails: ErrorDetail[] | undefined = undefined;

    if (exception instanceof I18nValidationException) {
      errorCode = 'VALIDATION_ERROR';
      errorMessage = '요청 값이 유효하지 않습니다.';
      errorDetails = this.extractI18nMessages(exception);
    }
    else if (exception instanceof ErrorException) {
      errorCode = exception.code;
      errorMessage = exception.message;
    }
    else if (exception instanceof HttpException) {
      errorCode = HttpStatus[status] || 'HTTP_EXCEPTION';
      const responseBody = exception.getResponse() as { message: string | string[], error: string };
      errorMessage = Array.isArray(responseBody?.message) ? responseBody.message[0] : (responseBody?.message || exception.message);
    }
    else if (exception instanceof DriverException) {
      errorCode = 'DATABASE_ERROR';
    }
    else if (exception instanceof Error) {
      console.error('UNKNOWN_ERROR: ', exception);
      errorMessage = exception.message;
    }

    const payload = ApiResponse.errorSync(errorCode, errorMessage, errorDetails);
    payload.requestId = this.cls.get('requestId');

    response
      .status(status)
      .json(payload);

    // 401, 403 등 가드에서 발생한 예외는 Interceptor를 거치지 않으므로 여기서 로그 기록
    void this.log(ctx.getRequest<Request>(), status, exception, payload);
  }

  private async log(request: Request, status: number, exception: unknown, responseData: unknown) {
    const requestId = this.cls.get('requestId');
    const session = this.cls.get('session');
    const userId = session?.user?.id;
    const organizationId = session?.user?.member?.organization.id;
    const referer = request.headers.referer || request.headers.referrer as string;

    let errorMessage: string | undefined;
    if (exception instanceof Error) {
      errorMessage = exception.stack;
    }
    else if (exception) {
      errorMessage = JSON.stringify(exception);
    }

    try {
      await this.em.create(Audit, {
        id: requestId,
        userId,
        organizationId,
        url: request.url,
        method: request.method,
        statusCode: status,
        duration: 0, // 필터에서는 정확한 소요 시간 측정 불가
        ip: request.ip,
        userAgent: request.headers['user-agent'] as string,
        referer,
        payload: this.maskSensitiveData(request.body as unknown),
        responseData: this.maskSensitiveData(responseData),
        error: errorMessage,
      }).persist().flush();
    }
    catch (e) {
      console.error('[Audit] Failed to save exception log:', e);
    }
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

  private extractI18nMessages(exception: I18nValidationException): ErrorDetail[] {
    const i18n = I18nContext.current();
    const errors = exception.errors as unknown as I18nValidationError[];

    return errors.flatMap((error) => {
      const constraints = error.constraints || {};
      return Object.keys(constraints).map((key) => {
        const translated = i18n
          ? i18n.t(`validation.${key}`, { args: { property: error.property } })
          : constraints[key];
        return {
          field: error.property,
          reason: translated,
        };
      });
    });
  }
}
