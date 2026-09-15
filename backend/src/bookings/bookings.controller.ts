import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AdminAuthGuard } from '../auth/admin-auth.guard';

import {
  UserAuthGuard,
  UserRequest,
} from '../users/user-auth.guard';

import { BookingsService } from './bookings.service';

import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingAvailabilityDto } from './dto/booking-availability.dto';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';
import { CreateIndividualRequestDto } from './dto/create-individual-request.dto';

import {
  AssignSessionDto,
  CreateBookingSlotDto,
  UpdateBookingSlotDto,
  UpdateBookingStatusDto,
} from './dto/admin-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(
    private readonly bookingsService: BookingsService,
  ) {}

  /* =======================================================
     PUBLIC
  ======================================================= */

  @Get('config')
  getConfig() {
    return this.bookingsService.getPublicConfig();
  }

  /*
   * Returns only dates explicitly opened by admin.
   *
   * Example:
   * GET /bookings/calendar?month=2026-09
   */
 @Get('calendar')
getCalendar(
  @Query('month') month: string,
  @Query('sessionType') sessionType?: string,
) {
  return this.bookingsService.getCalendar(
    month,
    sessionType,
  );
}

  /*
   * Returns both available + booked slots.
   */
@Get('availability')
getAvailability(
  @Query()
  query: BookingAvailabilityDto,
) {
  return this.bookingsService.getAvailability(
    query.date,
    query.sessionType,
  );
}

  /*
   * Creates a Razorpay order for a session
   * that requires payment (price > 0).
   *
   * Amount is always computed server-side
   * from the session's stored price — never
   * trust an amount sent by the client.
   */
  @Post('payment/order')
  createPaymentOrder(
    @Body() dto: CreatePaymentOrderDto,
  ) {
    return this.bookingsService.createPaymentOrder(dto);
  }

  /*
   * User creates booking.
   *
   * For paid sessions, the request must
   * include razorpayOrderId/PaymentId/Signature
   * — verified server-side before the seat
   * is reserved.
   */
  @Post()
  @UseGuards(UserAuthGuard)
  create(
    @Body() dto: CreateBookingDto,
    @Req() request: UserRequest,
  ) {
    return this.bookingsService.create(
      dto,
      request.user!.id,
    );
  }

  /*
   * Discovery Call, 1:1 Coaching, Deep Transformation.
   *
   * No slot exists yet — user just submits their
   * details + a preferred date/time. Admin assigns
   * the real date/time later.
   */
  @Post('request')
  @UseGuards(UserAuthGuard)
  createIndividualRequest(
    @Body() dto: CreateIndividualRequestDto,
    @Req() request: UserRequest,
  ) {
    return this.bookingsService.createIndividualRequestBooking(
      dto,
      request.user!.id,
    );
  }

  /*
   * Signed-in visitor's own dashboard — their
   * sessions, payment history and stats.
   */
  @Get('my')
  @UseGuards(UserAuthGuard)
  getMyBookings(@Req() request: UserRequest) {
    return this.bookingsService.getMyAccountOverview({
      id: request.user!.id,
      email: request.user!.email,
    });
  }

  /* =======================================================
     ADMIN — BOOKINGS
  ======================================================= */

  @UseGuards(AdminAuthGuard)
  @Get()
  findAll() {
    return this.bookingsService.findAll();
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/overview')
  getBookingsOverview() {
    return this.bookingsService.getBookingsOverview();
  }

  @UseGuards(AdminAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(
      id,
      dto.status,
    );
  }

  /*
   * Admin assigns the real date/time for a
   * Coaching / Deep Transformation request.
   * Creates the Zoom meeting and sends the
   * confirmation email to the user.
   */
  @UseGuards(AdminAuthGuard)
  @Patch(':id/assign')
  assignSession(
    @Param('id') id: string,
    @Body() dto: AssignSessionDto,
  ) {
    return this.bookingsService.assignSession(
      id,
      dto,
    );
  }

  /* =======================================================
     ADMIN — SLOT MANAGEMENT
  ======================================================= */

  

 /* =======================================================
   ADMIN — SLOT MANAGEMENT
======================================================= */

@UseGuards(AdminAuthGuard)
@Get('admin/slots')
getAdminSlots(
  @Query('month') month: string,
) {
  return this.bookingsService.getAdminSlots(
    month,
  );
}

/*
 * Create:
 *
 * Date + Time + Session Type + Capacity
 */
@UseGuards(AdminAuthGuard)
@Post('admin/slots')
createAdminSlot(
  @Body() dto: CreateBookingSlotDto,
) {
  return this.bookingsService.createAdminSlot(
    dto,
  );
}

/*
 * Edit one slot.
 */
@UseGuards(AdminAuthGuard)
@Patch('admin/slots/:id')
updateAdminSlot(
  @Param('id') id: string,
  @Body() dto: UpdateBookingSlotDto,
) {
  return this.bookingsService.updateAdminSlot(
    id,
    dto,
  );
}

/*
 * Remove one specific slot.
 */
@UseGuards(AdminAuthGuard)
@Delete('admin/slots/:id')
removeAdminSlot(
  @Param('id') id: string,
) {
  return this.bookingsService.removeAdminSlot(
    id,
  );
}

/*
 * Manually (re)create the Zoom meeting for a
 * webinar slot. Covers slots created before
 * eager Zoom creation existed, and gives the
 * admin a way to retry after a failure instead
 * of waiting for the first booking.
 */
@UseGuards(AdminAuthGuard)
@Post('admin/slots/:id/zoom')
createZoomForSlot(
  @Param('id') id: string,
) {
  return this.bookingsService.createZoomForSlot(
    id,
  );
}

/*
 * Close complete date.
 */
@UseGuards(AdminAuthGuard)
@Delete('admin/date/:date')
removeDateSlots(
  @Param('date') date: string,
) {
  return this.bookingsService.removeDateSlots(
    date,
  );
}

 
}