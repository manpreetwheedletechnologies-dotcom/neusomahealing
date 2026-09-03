import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { AdminAuthGuard } from './admin-auth.guard';

import { AuthController } from './auth.controller';

import { AuthService } from './auth.service';

import {
  Admin,
  AdminSchema,
} from './schemas/admin.schema';

import {
  AdminSession,
  AdminSessionSchema,
} from './schemas/admin-session.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Admin.name,
        schema: AdminSchema,
      },
      {
        name:
          AdminSession.name,
        schema:
          AdminSessionSchema,
      },
    ]),
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
    AdminAuthGuard,
  ],

  exports: [
    AuthService,
    AdminAuthGuard,
    MongooseModule,
  ],
})
export class AuthModule {}