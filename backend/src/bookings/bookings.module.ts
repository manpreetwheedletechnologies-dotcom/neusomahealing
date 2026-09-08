import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module';

import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { ZoomService } from './zoom.service';
import { BookingMailService } from './booking-mail.service';

import {
  Booking,
  BookingSchema,
} from './schemas/booking.schema';

import {
  BookingSettings,
  BookingSettingsSchema,
} from './schemas/booking-settings.schema';

import {
  BookingSlot,
  BookingSlotSchema,
} from './schemas/booking-slot.schema';

@Module({
  imports: [
    AuthModule,

    MongooseModule.forFeature([
      {
        name: Booking.name,
        schema: BookingSchema,
      },
      {
        name: BookingSettings.name,
        schema: BookingSettingsSchema,
      },

      {
  name: BookingSlot.name,
  schema: BookingSlotSchema,
},
    ]),
  ],

  controllers: [BookingsController],

  providers: [BookingsService, ZoomService, BookingMailService],

  exports: [BookingsService],
})
export class BookingsModule {}