import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { BaseResponse } from '../dto/response.dto';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly cls: ClsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<BaseResponse> {
    const requestId = this.cls.get('requestId');

    return next.handle().pipe(
      map((data: BaseResponse) => {
        // Only modify if it's our BaseResponse format
        if (data && typeof data === 'object' && 'success' in data) {
          data.requestId = requestId;
        }
        return data;
      }),
    );
  }
}
