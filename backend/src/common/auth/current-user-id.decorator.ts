import {
  UnauthorizedException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { parseCookieHeader } from './cookie.utils';
import { SESSION_COOKIE_NAME } from './session.constants';

export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const cookies = parseCookieHeader(request.headers.cookie);
    const rawUserId = cookies[SESSION_COOKIE_NAME];
    const userId = Number(rawUserId);

    if (!rawUserId || Number.isNaN(userId) || userId <= 0) {
      throw new UnauthorizedException('Authentication required');
    }

    return userId;
  },
);
