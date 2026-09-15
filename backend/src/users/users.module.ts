import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module';

import {
  AudienceContact,
  AudienceContactSchema,
} from './schemas/audience-contact.schema';

import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';

import {
  User,
  UserSchema,
} from './schemas/user.schema';

import {
  UserSession,
  UserSessionSchema,
} from './schemas/user-session.schema';

import {
  OptionalUserGuard,
  UserAuthGuard,
} from './user-auth.guard';

import { AudienceService } from './audience.service';
import { UserMailService } from './user-mail.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    AuthModule,

    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      {
        name: UserSession.name,
        schema: UserSessionSchema,
      },
      {
        name: Notification.name,
        schema: NotificationSchema,
      },
      {
        name: AudienceContact.name,
        schema: AudienceContactSchema,
      },
    ]),
  ],

  controllers: [UsersController],

  providers: [
    UsersService,
    AudienceService,
    UserMailService,
    UserAuthGuard,
    OptionalUserGuard,
  ],

  exports: [
    UsersService,
    AudienceService,
    UserMailService,
    UserAuthGuard,
    OptionalUserGuard,
    MongooseModule,
  ],
})
export class UsersModule {}
