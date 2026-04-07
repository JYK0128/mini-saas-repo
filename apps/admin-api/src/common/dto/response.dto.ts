import { ApiProperty } from '@nestjs/swagger';

export class ErrorDetail {
  @ApiProperty({ description: '에러 발생 필드', nullable: true })
  field?: string;

  @ApiProperty({ description: '에러 이유' })
  reason!: string;
}

export class BaseResponse {
  @ApiProperty({ description: '성공 여부', example: true })
  success!: boolean;

  @ApiProperty({ description: '응답 코드', example: 'SUCCESS' })
  code!: string;

  @ApiProperty({ description: '응답 메시지', nullable: true })
  message?: string;

  @ApiProperty({ description: '응답 생성 시간' })
  timestamp!: Date;

  @ApiProperty({ description: '요청 ID' })
  requestId!: string;

  @ApiProperty({ description: '에러 목록', type: [ErrorDetail], nullable: true })
  errors?: ErrorDetail[];
}

export class ApiResponse<T = null> extends BaseResponse {
  @ApiProperty({ description: '응답 데이터', nullable: true })
  data!: T | null;

  static okSync<T>(data: T, message: string = '요청이 정상적으로 처리되었습니다.', code: string = 'SUCCESS') {
    const response = new ApiResponse<T>();
    response.success = true;
    response.code = code;
    response.message = message;
    response.data = data;
    response.timestamp = new Date();
    // requestId will be populated by an interceptor
    return response;
  }

  static ok<T>(data: T, message?: string, code?: string) {
    return Promise.resolve(ApiResponse.okSync(data, message, code));
  }

  static errorSync(code: string, message: string, errors?: ErrorDetail[]) {
    const response = new ApiResponse();
    response.success = false;
    response.code = code;
    response.message = message;
    response.data = null;
    response.timestamp = new Date();
    if (errors) {
      response.errors = errors;
    }
    // requestId will be populated by a filter
    return response;
  }

  static error(code: string, message: string, errors?: ErrorDetail[]) {
    return Promise.resolve(ApiResponse.errorSync(code, message, errors));
  }
}
