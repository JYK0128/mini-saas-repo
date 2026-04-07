import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { ClsModule } from 'nestjs-cls';
import { I18nModule, I18nValidationPipe } from 'nestjs-i18n';

import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { ExceptionFilter } from '@/common/filters/exception.filter';
import { AuthGuard } from '@/common/guards/auth.guard';
import { PermissionGuard } from '@/common/guards/permission.guard';
import { RuleGuard } from '@/common/guards/rule.guard';
import { AuditInterceptor } from '@/common/interceptors/audit.interceptor';
import { ContextMiddleware } from '@/common/middleware/context.middleware';
import { SessionMiddleware } from '@/common/middleware/session.middleware';
import { SessionStore } from '@/common/tools/SessionStore';
import { AuditSubscriber } from '@/database/subscribers/audit.subscriber';
import { i18nConfig } from '@/i18n.config';
import mikroConfig from '@/mikro-orm.config';
import * as Modules from '@/routes';

import { DatabaseInterceptor } from './common/interceptors/database.interceptor';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

@Module({
  imports: [
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
    MikroOrmModule.forRoot(mikroConfig),
    I18nModule.forRoot(i18nConfig),
    ...Object.values(Modules),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SessionStore,
    SessionMiddleware,
    ContextMiddleware,
    AuditSubscriber,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RuleGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DatabaseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_PIPE,
      useValue: new I18nValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      provide: APP_FILTER,
      useClass: ExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(cookieParser(), SessionMiddleware, ContextMiddleware).forRoutes('*');
  }
}
