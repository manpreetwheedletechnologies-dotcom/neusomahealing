import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';

import { createHash, randomBytes } from 'crypto';
import { Model, Types } from 'mongoose';

import {
  hashPassword,
  verifyPassword,
} from '../auth/utils/password.util';

import {
  ChangeUserPasswordDto,
  LoginUserDto,
  RegisterUserDto,
  UpdateUserProfileDto,
} from './dto/user-auth.dto';

import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';

import {
  User,
  UserDocument,
} from './schemas/user.schema';

import {
  UserSession,
  UserSessionDocument,
} from './schemas/user-session.schema';

import { AudienceService } from './audience.service';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(
    UsersService.name,
  );

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    @InjectModel(UserSession.name)
    private readonly sessionModel: Model<UserSessionDocument>,

    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,

    private readonly audienceService: AudienceService,

    private readonly configService: ConfigService,
  ) {}

  /* =======================================================
     REGISTER
  ======================================================= */

  async register(dto: RegisterUserDto) {
    const existing = await this.userModel
      .findOne({ email: dto.email })
      .exec();

    if (existing) {
      throw new ConflictException(
        'An account with this email already exists. Please sign in instead.',
      );
    }

    const passwordHash = await hashPassword(
      dto.password,
    );

    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
    });

    await this.audienceService.capture({
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      source: 'account',
      hasAccount: true,
    });

    // Log them straight in — no separate sign-in step
    // after registering.
    return this.issueSession(user);
  }

  /* =======================================================
     LOGIN
  ======================================================= */

  async login(dto: LoginUserDto) {
    const user = await this.userModel
      .findOne({ email: dto.email })
      .select(
        '+passwordHash +failedLoginAttempts +lockUntil',
      );

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    if (
      user.lockUntil &&
      user.lockUntil.getTime() > Date.now()
    ) {
      throw new HttpException(
        'Too many failed login attempts. Please try again after 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (
      user.lockUntil &&
      user.lockUntil.getTime() <= Date.now()
    ) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
    }

    const isPasswordValid = await verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      user.failedLoginAttempts =
        (user.failedLoginAttempts || 0) + 1;

      if (
        user.failedLoginAttempts >=
        MAX_FAILED_ATTEMPTS
      ) {
        user.lockUntil = new Date(
          Date.now() + LOCK_TIME_MS,
        );

        user.failedLoginAttempts = 0;
      }

      await user.save();

      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLogin = new Date();

    await user.save();

    return this.issueSession(user);
  }

  /* =======================================================
     SESSIONS
  ======================================================= */

  private async issueSession(user: UserDocument) {
    const rawToken = randomBytes(48).toString('hex');

    const tokenHash =
      this.hashSessionToken(rawToken);

    const expiresAt = this.getSessionExpiry();

    await this.sessionModel.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    return {
      token: rawToken,
      expiresAt,
      user: this.toSafeUser(user),
    };
  }

  async getUserFromSession(rawToken: string) {
    if (!rawToken) {
      throw new UnauthorizedException(
        'Please sign in to continue.',
      );
    }

    const session = await this.sessionModel.findOne({
      tokenHash: this.hashSessionToken(rawToken),
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new UnauthorizedException(
        'Your session has expired. Please sign in again.',
      );
    }

    const user = await this.userModel.findById(
      session.userId,
    );

    if (!user || !user.isActive) {
      await this.sessionModel.deleteOne({
        _id: session._id,
      });

      throw new UnauthorizedException(
        'This account is no longer available.',
      );
    }

    return this.toSafeUser(user);
  }

  async logout(rawToken: string | null) {
    if (!rawToken) {
      return;
    }

    await this.sessionModel.deleteOne({
      tokenHash: this.hashSessionToken(rawToken),
    });
  }

  /* =======================================================
     PROFILE
  ======================================================= */

  async updateProfile(
    userId: string,
    dto: UpdateUserProfileDto,
  ) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new UnauthorizedException(
        'This account is no longer available.',
      );
    }

    if (dto.name !== undefined) {
      user.name = dto.name;
    }

    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }

    if (dto.notifyNewSessions !== undefined) {
      user.notifyNewSessions = dto.notifyNewSessions;

      // Announcements are sent through the shared
      // audience list, so the preference has to land
      // there too or the toggle would do nothing.
      await this.audienceService.syncSubscriptionForEmail(
        user.email,
        dto.notifyNewSessions,
      );
    }

    await user.save();

    return {
      success: true,
      message: 'Profile updated.',
      data: { user: this.toSafeUser(user) },
    };
  }

  async changePassword(
    userId: string,
    dto: ChangeUserPasswordDto,
  ) {
    const user = await this.userModel
      .findById(userId)
      .select('+passwordHash');

    if (!user) {
      throw new UnauthorizedException(
        'This account is no longer available.',
      );
    }

    const isCurrentValid = await verifyPassword(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentValid) {
      throw new BadRequestException(
        'Your current password is incorrect.',
      );
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'Your new password must be different from the current one.',
      );
    }

    user.passwordHash = await hashPassword(
      dto.newPassword,
    );

    await user.save();

    /*
     * Every other session is invalidated so a
     * password change actually locks other devices
     * out. The caller re-issues a fresh cookie.
     */
    await this.sessionModel.deleteMany({
      userId: user._id,
    });

    return this.issueSession(user);
  }

  /* =======================================================
     NOTIFICATIONS
  ======================================================= */

  async listNotifications(userId: string) {
    const notifications = await this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    const unreadCount =
      await this.notificationModel.countDocuments({
        userId: new Types.ObjectId(userId),
        isRead: false,
      });

    return {
      success: true,
      data: {
        unreadCount,
        notifications: notifications.map((item) => ({
          _id: item._id.toString(),
          type: item.type,
          title: item.title,
          body: item.body,
          link: item.link,
          isRead: item.isRead,
          createdAt: (item as any).createdAt,
        })),
      },
    };
  }

  async markNotificationRead(
    userId: string,
    notificationId: string,
  ) {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestException(
        'Invalid notification.',
      );
    }

    await this.notificationModel.updateOne(
      {
        _id: new Types.ObjectId(notificationId),
        userId: new Types.ObjectId(userId),
      },
      { $set: { isRead: true } },
    );

    return { success: true };
  }

  async markAllNotificationsRead(userId: string) {
    await this.notificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        isRead: false,
      },
      { $set: { isRead: true } },
    );

    return { success: true };
  }

  /*
   * Fan-out helper used when the admin publishes a
   * new session slot. Writes one notification per
   * active user in a single bulk insert.
   */
  async notifyAllUsers(input: {
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
  }) {
    const users = await this.userModel
      .find({ isActive: true })
      .select('_id')
      .exec();

    if (!users.length) {
      return { notified: 0 };
    }

    await this.notificationModel.insertMany(
      users.map((user) => ({
        userId: user._id,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
      })),
    );

    return { notified: users.length };
  }

  /*
   * Recipients for the "new session" announcement
   * email — only users who haven't opted out.
   */
  async getEmailRecipients() {
    const users = await this.userModel
      .find({
        isActive: true,
        notifyNewSessions: true,
      })
      .select('name email')
      .exec();

    return users.map((user) => ({
      name: user.name,
      email: user.email,
    }));
  }

  /* =======================================================
     HELPERS
  ======================================================= */

  private hashSessionToken(rawToken: string) {
    return createHash('sha256')
      .update(rawToken)
      .digest('hex');
  }

  private getSessionExpiry() {
    const configuredDays = Number(
      this.configService.get<string>(
        'USER_SESSION_DAYS',
      ) || 30,
    );

    const safeDays = Number.isFinite(configuredDays)
      ? Math.min(Math.max(configuredDays, 1), 365)
      : 30;

    return new Date(
      Date.now() + safeDays * 24 * 60 * 60 * 1000,
    );
  }

  private toSafeUser(user: UserDocument) {
    return {
      id: (user._id as Types.ObjectId).toString(),
      name: user.name,
      email: user.email,
      phone: user.phone,
      notifyNewSessions: user.notifyNewSessions,
      lastLogin: user.lastLogin,
    };
  }
}
