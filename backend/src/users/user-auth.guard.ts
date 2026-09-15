import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

import { getCookieValue } from '../auth/utils/cookie.util';
import { UsersService } from './users.service';

export const USER_SESSION_COOKIE =
  'neusoma_user_session';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  notifyNewSessions: boolean;
  lastLogin: Date | null;
};

export type UserRequest = Request & {
  user?: AuthenticatedUser;
};

/*
 * Blocks the request unless a valid user session
 * cookie is present. Used for everything under
 * /account and for creating bookings.
 */
@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<UserRequest>();

    const token = getCookieValue(
      request.headers.cookie,
      USER_SESSION_COOKIE,
    );

    if (!token) {
      throw new UnauthorizedException(
        'Please sign in to continue.',
      );
    }

    request.user =
      await this.usersService.getUserFromSession(
        token,
      );

    return true;
  }
}

/*
 * Never blocks — just attaches request.user when a
 * valid session exists. Lets endpoints behave
 * differently for signed-in visitors without
 * locking anonymous ones out.
 */
@Injectable()
export class OptionalUserGuard implements CanActivate {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<UserRequest>();

    const token = getCookieValue(
      request.headers.cookie,
      USER_SESSION_COOKIE,
    );

    if (token) {
      try {
        request.user =
          await this.usersService.getUserFromSession(
            token,
          );
      } catch {
        // Expired/invalid session is not an error
        // here — the visitor is simply anonymous.
        request.user = undefined;
      }
    }

    return true;
  }
}
