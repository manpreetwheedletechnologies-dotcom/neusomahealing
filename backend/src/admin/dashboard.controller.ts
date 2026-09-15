import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { EnquiriesService } from '../enquiries/enquiries.service';
import { BookingsService } from '../bookings/bookings.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { BlogService } from '../blog/blog.service';
import { VideosService } from '../videos/videos.service';
import { CoachingService } from '../coaching/coaching.service';
import { TestimonialsService } from '../testimonials/testimonials.service';
import { ChatService } from '../chat/chat.service';

@Controller('admin')
export class DashboardController {
  constructor(
    private readonly enquiriesService: EnquiriesService,
    private readonly bookingsService: BookingsService,
    private readonly subscribersService: SubscribersService,
    private readonly blogService: BlogService,
    private readonly videosService: VideosService,
    private readonly coachingService: CoachingService,
    private readonly testimonialsService: TestimonialsService,
    private readonly chatService: ChatService,
  ) {}

  @Get('dashboard')
  @UseGuards(AdminAuthGuard)
  async getDashboard() {
    const [
      enquiryStats,
      bookingStats,
      subscribers,
      posts,
      videos,
      coaching,
      testimonials,
      chatStats,
    ] = await Promise.all([
      this.enquiriesService.countStats(),
      this.bookingsService.countStats(),
      this.subscribersService.count(),
      this.blogService.count(),
      this.videosService.count(),
      this.coachingService.count(),
      this.testimonialsService.count(),
      this.chatService.countStats(),
    ]);

    return {
      newEnquiries: enquiryStats.new,
      totalEnquiries: enquiryStats.total,
      newBookings: bookingStats.new,
      totalBookings: bookingStats.total,
      subscribers,
      posts,
      videos,
      coaching,
      testimonials,
      newChats: chatStats.new,
      totalChats: chatStats.total,
    };
  }
}
