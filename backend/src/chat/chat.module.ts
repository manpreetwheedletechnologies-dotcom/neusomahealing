import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module';
import { CoachingModule } from '../coaching/coaching.module';
import { BlogModule } from '../blog/blog.module';
import { VideosModule } from '../videos/videos.module';
import { TestimonialsModule } from '../testimonials/testimonials.module';
import { ContentModule } from '../content/content.module';
import { BookingsModule } from '../bookings/bookings.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import {
  ChatConversation,
  ChatConversationSchema,
} from './schemas/chat.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatConversation.name, schema: ChatConversationSchema },
    ]),
    AuthModule,
    CoachingModule,
    BlogModule,
    VideosModule,
    TestimonialsModule,
    ContentModule,
    BookingsModule,
    UsersModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}