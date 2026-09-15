import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

import { AdminAuthGuard } from '../auth/admin-auth.guard';

import { ConfigService } from '@nestjs/config';

import {
  CookieOptions,
  Request,
  Response,
} from 'express';

import { getCookieValue } from '../auth/utils/cookie.util';

import {
  ChangeUserPasswordDto,
  LoginUserDto,
  RegisterUserDto,
  UpdateUserProfileDto,
} from './dto/user-auth.dto';

import {
  USER_SESSION_COOKIE,
  UserAuthGuard,
  UserRequest,
} from './user-auth.guard';

import { AudienceService } from './audience.service';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly audienceService: AudienceService,
    private readonly configService: ConfigService,
  ) {}

  /* =======================================================
     AUTH
  ======================================================= */

  @Post('auth/user/register')
  async register(
    @Body() dto: RegisterUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.usersService.register(
      dto,
    );

    response.cookie(
      USER_SESSION_COOKIE,
      result.token,
      this.getCookieOptions(result.expiresAt),
    );

    return {
      success: true,
      message: 'Your account is ready.',
      data: { user: result.user },
    };
  }

  @Post('auth/user/login')
  async login(
    @Body() dto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.usersService.login(dto);

    response.cookie(
      USER_SESSION_COOKIE,
      result.token,
      this.getCookieOptions(result.expiresAt),
    );

    return {
      success: true,
      message: 'Signed in successfully.',
      data: { user: result.user },
    };
  }

  @Get('auth/user/me')
  @UseGuards(UserAuthGuard)
  me(@Req() request: UserRequest) {
    return {
      success: true,
      data: { user: request.user },
    };
  }

  @Post('auth/user/logout')
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = getCookieValue(
      request.headers.cookie,
      USER_SESSION_COOKIE,
    );

    await this.usersService.logout(token);

    response.clearCookie(
      USER_SESSION_COOKIE,
      this.getBaseCookieOptions(),
    );

    return {
      success: true,
      message: 'Signed out successfully.',
    };
  }

  /* =======================================================
     PROFILE
  ======================================================= */

  @Patch('account/profile')
  @UseGuards(UserAuthGuard)
  updateProfile(
    @Req() request: UserRequest,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateProfile(
      request.user!.id,
      dto,
    );
  }

  @Post('account/password')
  @UseGuards(UserAuthGuard)
  async changePassword(
    @Req() request: UserRequest,
    @Body() dto: ChangeUserPasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result =
      await this.usersService.changePassword(
        request.user!.id,
        dto,
      );

    // Other sessions were revoked, so refresh this
    // device's cookie with the newly issued token.
    response.cookie(
      USER_SESSION_COOKIE,
      result.token,
      this.getCookieOptions(result.expiresAt),
    );

    return {
      success: true,
      message: 'Password updated.',
      data: { user: result.user },
    };
  }

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  @Get('account/notifications')
  @UseGuards(UserAuthGuard)
  listNotifications(@Req() request: UserRequest) {
    return this.usersService.listNotifications(
      request.user!.id,
    );
  }

  @Patch('account/notifications/read-all')
  @UseGuards(UserAuthGuard)
  markAllRead(@Req() request: UserRequest) {
    return this.usersService.markAllNotificationsRead(
      request.user!.id,
    );
  }

  @Patch('account/notifications/:id/read')
  @UseGuards(UserAuthGuard)
  markRead(
    @Req() request: UserRequest,
    @Param('id') id: string,
  ) {
    return this.usersService.markNotificationRead(
      request.user!.id,
      id,
    );
  }

  /* =======================================================
     AUDIENCE
  ======================================================= */

  /*
   * Public, token-based opt-out. Contacts captured
   * from a form have no account to sign into, so the
   * token in their email footer is the only handle
   * they have.
   */
  @Get('audience/unsubscribe')
  unsubscribe(@Query('token') token: string) {
    return this.audienceService.unsubscribeByToken(
      token,
    );
  }

  /*
   * Admin view of every contact captured across all
   * forms — the list that receives session
   * announcements.
   */
  @Get('admin/audience')
  @UseGuards(AdminAuthGuard)
  listAudience(@Query('search') search?: string) {
    return this.audienceService.listForAdmin(search);
  }

  /* =======================================================
     COOKIES
  ======================================================= */

  private getCookieOptions(
    expiresAt: Date,
  ): CookieOptions {
    return {
      ...this.getBaseCookieOptions(),
      expires: expiresAt,
    };
  }

  private getBaseCookieOptions(): CookieOptions {
    const isProduction =
      this.configService.get<string>('NODE_ENV') ===
      'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
    };
  }
}
