import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';

import {
  createHash,
  randomBytes,
} from 'crypto';

import {
  Model,
  Types,
} from 'mongoose';

import { LoginAdminDto } from './dto/login-admin.dto';

import {
  Admin,
  AdminDocument,
} from './schemas/admin.schema';

import {
  AdminSession,
  AdminSessionDocument,
} from './schemas/admin-session.schema';

import { verifyPassword } from './utils/password.util';

const MAX_FAILED_ATTEMPTS = 5;

const LOCK_TIME_MS =
  15 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name)
    private readonly adminModel:
      Model<AdminDocument>,

    @InjectModel(AdminSession.name)
    private readonly sessionModel:
      Model<AdminSessionDocument>,

    private readonly configService:
      ConfigService,
  ) {}

  async login(dto: LoginAdminDto) {
    const admin =
      await this.adminModel
        .findOne({
          email: dto.email,
        })
        .select(
          '+passwordHash +failedLoginAttempts +lockUntil',
        );

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    if (
      admin.lockUntil &&
      admin.lockUntil.getTime() >
        Date.now()
    ) {
      throw new HttpException(
        'Too many failed login attempts. Please try again after 15 minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (
      admin.lockUntil &&
      admin.lockUntil.getTime() <=
        Date.now()
    ) {
      admin.failedLoginAttempts = 0;
      admin.lockUntil = null;
    }

    const isPasswordValid =
      await verifyPassword(
        dto.password,
        admin.passwordHash,
      );

    if (!isPasswordValid) {
      admin.failedLoginAttempts =
        (admin.failedLoginAttempts || 0) +
        1;

      if (
        admin.failedLoginAttempts >=
        MAX_FAILED_ATTEMPTS
      ) {
        admin.lockUntil = new Date(
          Date.now() +
            LOCK_TIME_MS,
        );

        admin.failedLoginAttempts = 0;
      }

      await admin.save();

      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    admin.lastLogin = new Date();

    await admin.save();

    const rawToken = randomBytes(
      48,
    ).toString('hex');

    const tokenHash =
      this.hashSessionToken(rawToken);

    const expiresAt =
      this.getSessionExpiry();

    await this.sessionModel.create({
      adminId: admin._id,
      tokenHash,
      expiresAt,
    });

    return {
      token: rawToken,
      expiresAt,

      admin: this.toSafeAdmin(admin),
    };
  }

  async getAdminFromSession(
    rawToken: string,
  ) {
    if (!rawToken) {
      throw new UnauthorizedException(
        'Admin authentication required.',
      );
    }

    const tokenHash =
      this.hashSessionToken(rawToken);

    const session =
      await this.sessionModel.findOne({
        tokenHash,

        expiresAt: {
          $gt: new Date(),
        },
      });

    if (!session) {
      throw new UnauthorizedException(
        'Your admin session has expired.',
      );
    }

    const admin =
      await this.adminModel.findById(
        session.adminId,
      );

    if (!admin || !admin.isActive) {
      await this.sessionModel.deleteOne({
        _id: session._id,
      });

      throw new UnauthorizedException(
        'Admin account is not available.',
      );
    }

    return this.toSafeAdmin(admin);
  }

  async logout(
    rawToken: string | null,
  ) {
    if (!rawToken) {
      return;
    }

    await this.sessionModel.deleteOne({
      tokenHash:
        this.hashSessionToken(
          rawToken,
        ),
    });
  }

  private hashSessionToken(
    rawToken: string,
  ) {
    return createHash('sha256')
      .update(rawToken)
      .digest('hex');
  }

  private getSessionExpiry() {
    const configuredHours = Number(
      this.configService.get<string>(
        'ADMIN_SESSION_HOURS',
      ) || 12,
    );

    const safeHours =
      Number.isFinite(
        configuredHours,
      )
        ? Math.min(
            Math.max(
              configuredHours,
              1,
            ),
            168,
          )
        : 12;

    return new Date(
      Date.now() +
        safeHours *
          60 *
          60 *
          1000,
    );
  }

  private toSafeAdmin(
    admin: AdminDocument,
  ) {
    return {
      id: (
        admin._id as Types.ObjectId
      ).toString(),

      name: admin.name,
      email: admin.email,
      role: admin.role,
      lastLogin: admin.lastLogin,
    };
  }
}