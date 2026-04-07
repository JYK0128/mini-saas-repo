import { Controller, Get } from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';

import { AppService } from '@/app.service';
import { Public } from '@/common/decorators/public.decorator';

@Public()
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly i18n: I18nService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('i18n')
  getI18n(): { hello: string, msg: string, lang?: string } {
    const hello = this.i18n.t('common.HELLO', {
      lang: I18nContext.current()?.lang,
    });
    const msg = this.i18n.t('common.TEST.MSG', {
      lang: I18nContext.current()?.lang,
      args: { name: 'Antigravity' },
    });

    return {
      hello,
      msg,
      lang: I18nContext.current()?.lang,
    };
  }
}
