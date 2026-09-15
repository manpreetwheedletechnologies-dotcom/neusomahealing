import { Module } from '@nestjs/common';
import {ConfigModule, ConfigService,} from '@nestjs/config';

import { MongooseModule } from '@nestjs/mongoose';

import { EnquiriesModule } from './enquiries/enquiries.module';
import { VideosModule } from './videos/videos.module';
import { BlogModule } from './blog/blog.module';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module';
import { CoachingModule } from './coaching/coaching.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { ContentModule } from './content/content.module';
import { DashboardModule } from './admin/dashboard.module';
import { ChatModule } from './chat/chat.module';
import { UploadsModule } from './uploads/uploads.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => {
        const mongoUri =
          configService.get<string>(
            'MONGODB_URI',
          );

        if (!mongoUri) {
          throw new Error(
            'MONGODB_URI is missing from backend/.env',
          );
        }

        return {
          uri: mongoUri,
        };
      },
    }),

    EnquiriesModule,
    VideosModule,
    BlogModule,
    AuthModule,
    BookingsModule,
    CoachingModule,
    TestimonialsModule,
    SubscribersModule,
    ContentModule,
    DashboardModule,
    ChatModule,
    UploadsModule,
    UsersModule,
  ],
})
export class AppModule {}