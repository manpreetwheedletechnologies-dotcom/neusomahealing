import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Request } from 'express';

import { AuthService } from './auth.service';

import { getCookieValue } from './utils/cookie.util';

export const ADMIN_SESSION_COOKIE =
  'neusoma_admin_session';

export type AuthenticatedAdmin = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  lastLogin: Date | null;
};

export type AdminRequest =
  Request & {
    admin?: AuthenticatedAdmin;
  };

@Injectable()
export class AdminAuthGuard
  implements CanActivate
{
  constructor(
    private readonly authService:
      AuthService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context
        .switchToHttp()
        .getRequest<AdminRequest>();

    const token =
      getCookieValue(
        request.headers.cookie,
        ADMIN_SESSION_COOKIE,
      );

    if (!token) {
      throw new UnauthorizedException(
        'Admin authentication required.',
      );
    }

    request.admin =
      await this.authService.getAdminFromSession(
        token,
      );

    return true;
  }
}