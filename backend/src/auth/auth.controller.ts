import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  Request,
  Response,
  CookieOptions,
} from 'express';

import {
  ADMIN_SESSION_COOKIE,
  AdminAuthGuard,
  AdminRequest,
} from './admin-auth.guard';

import { AuthService } from './auth.service';

import { LoginAdminDto } from './dto/login-admin.dto';

import { getCookieValue } from './utils/cookie.util';

@Controller('auth/admin')
export class AuthController {
  constructor(
    private readonly authService:
      AuthService,

    private readonly configService:
      ConfigService,
  ) {}

  @Post('login')
  async login(
    @Body()
    dto: LoginAdminDto,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const result =
      await this.authService.login(
        dto,
      );

    response.cookie(
      ADMIN_SESSION_COOKIE,
      result.token,
      this.getCookieOptions(
        result.expiresAt,
      ),
    );

    return {
      success: true,

      message:
        'Login successful.',

      data: {
        admin: result.admin,
      },
    };
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  async me(
    @Req()
    request: AdminRequest,
  ) {
    return {
      success: true,

      data: {
        admin: request.admin,
      },
    };
  }

  @Post('logout')
  async logout(
    @Req()
    request: Request,

    @Res({
      passthrough: true,
    })
    response: Response,
  ) {
    const token =
      getCookieValue(
        request.headers.cookie,
        ADMIN_SESSION_COOKIE,
      );

    await this.authService.logout(
      token,
    );

    response.clearCookie(
      ADMIN_SESSION_COOKIE,
      this.getBaseCookieOptions(),
    );

    return {
      success: true,

      message:
        'Logged out successfully.',
    };
  }

  private getCookieOptions(
    expiresAt: Date,
  ): CookieOptions {
    return {
      ...this.getBaseCookieOptions(),
      expires: expiresAt,
    };
  }

  private getBaseCookieOptions():
    CookieOptions {
    const isProduction =
      this.configService.get<string>(
        'NODE_ENV',
      ) === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    };
  }
}