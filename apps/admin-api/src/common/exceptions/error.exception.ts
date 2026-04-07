import { HttpException } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';

export class ErrorException extends HttpException {
  code: string;
  data?: unknown;

  constructor(errorCode: string, statusCode: number = 500, data?: unknown) {
    const i18n = I18nContext.current();
    let message = errorCode;
    if (i18n) {
      message = i18n.t(`error.${errorCode}`, { defaultValue: `ERROR CODE: ${errorCode}` });
    }

    super(message, statusCode);
    this.code = errorCode;
    this.data = data;
  }
}
