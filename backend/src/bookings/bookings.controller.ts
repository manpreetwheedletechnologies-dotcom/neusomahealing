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
  UseGuards,
} from '@nestjs/common';

import { AdminAuthGuard } from '../auth/admin-auth.guard';

import { BookingsService } from './bookings.service';

import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingAvailabilityDto } from './dto/booking-availability.dto';

import {
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
   * User creates booking.
   */
  @Post()
  create(
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(dto);
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