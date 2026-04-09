import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const Cookie = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const cookies = (request.cookies || {}) as Record<string, string | undefined>;
  return cookies[data];
});

export const Cookies = createParamDecorator((ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  const cookies = (request.cookies || {}) as Record<string, string | undefined>;
  return cookies;
});
