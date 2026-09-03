import { ConfigService } from '@nestjs/config';

import { getModelToken } from '@nestjs/mongoose';

import { NestFactory } from '@nestjs/core';

import { Model } from 'mongoose';

import { AppModule } from '../../app.module';

import {
  Admin,
  AdminDocument,
} from '../../auth/schemas/admin.schema';

import { hashPassword } from '../../auth/utils/password.util';

function requireEnvironmentValue(
  value: string | undefined,
  key: string,
) {
  const normalized =
    value?.trim();

  if (!normalized) {
    throw new Error(
      `${key} is required to seed the admin account.`,
    );
  }

  return normalized;
}

function validateSeedCredentials(
  email: string,
  password: string,
) {
  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(email)
  ) {
    throw new Error(
      'ADMIN_SEED_EMAIL must be a valid email address.',
    );
  }

  if (password.length < 12) {
    throw new Error(
      'ADMIN_SEED_PASSWORD must contain at least 12 characters.',
    );
  }
}

async function seedAdmin() {
  const app =
    await NestFactory.createApplicationContext(
      AppModule,
      {
        logger: [
          'error',
          'warn',
          'log',
        ],
      },
    );

  try {
    const configService =
      app.get(ConfigService);

    const adminModel =
      app.get<
        Model<AdminDocument>
      >(
        getModelToken(
          Admin.name,
        ),
      );

    const name =
      configService
        .get<string>(
          'ADMIN_SEED_NAME',
        )
        ?.trim() ||
      'Administrator';

    const email =
      requireEnvironmentValue(
        configService.get<string>(
          'ADMIN_SEED_EMAIL',
        ),
        'ADMIN_SEED_EMAIL',
      ).toLowerCase();

    const password =
      requireEnvironmentValue(
        configService.get<string>(
          'ADMIN_SEED_PASSWORD',
        ),
        'ADMIN_SEED_PASSWORD',
      );

    validateSeedCredentials(
      email,
      password,
    );

    const passwordHash =
      await hashPassword(
        password,
      );

    const existingAdmin =
      await adminModel
        .findOne({
          email,
        })
        .select(
          '+passwordHash +failedLoginAttempts +lockUntil',
        );

    if (existingAdmin) {
      existingAdmin.name =
        name;

      existingAdmin.passwordHash =
        passwordHash;

      existingAdmin.role =
        'superadmin';

      existingAdmin.isActive =
        true;

      existingAdmin.failedLoginAttempts =
        0;

      existingAdmin.lockUntil =
        null;

      await existingAdmin.save();

      console.log(
        `Admin account updated: ${email}`,
      );

      return;
    }

    await adminModel.create({
      name,
      email,
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });

    console.log(
      `Admin account created: ${email}`,
    );
  } finally {
    await app.close();
  }
}

seedAdmin().catch(
  (error) => {
    console.error(
      'Admin seeding failed:',
      error instanceof Error
        ? error.message
        : error,
    );

    process.exit(1);
  },
);