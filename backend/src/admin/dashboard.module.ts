import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EnquiriesModule } from '../enquiries/enquiries.module';
import { BookingsModule } from '../bookings/bookings.module';
import { SubscribersModule } from '../subscribers/subscribers.module';
import { BlogModule } from '../blog/blog.module';
import { VideosModule } from '../videos/videos.module';
import { CoachingModule } from '../coaching/coaching.module';
import { TestimonialsModule } from '../testimonials/testimonials.module';
import { ChatModule } from '../chat/chat.module';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    AuthModule,
    EnquiriesModule,
    BookingsModule,
    SubscribersModule,
    BlogModule,
    VideosModule,
    CoachingModule,
    TestimonialsModule,
    ChatModule,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
