import { Transform } from 'class-transformer';

import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  BOOKING_STATUSES,
  BookingStatus,
} from '../schemas/booking.schema';

/* =========================================================
   UPDATE BOOKING STATUS
========================================================= */

export class UpdateBookingStatusDto {
  @IsIn(BOOKING_STATUSES, {
    message:
      'Status must be pending, confirmed, completed or cancelled.',
  })
  status: BookingStatus;
}

/* =========================================================
   CREATE ADMIN SESSION SLOT
========================================================= */

export class CreateBookingSlotDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message:
      'Booking date must use YYYY-MM-DD format.',
  })
  bookingDate: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toUpperCase()
      : value,
  )
  @IsString()
  @Matches(
    /^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i,
    {
      message:
        'Time must use format such as 11:00 AM.',
    },
  )
  timeSlot: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsString()
  @IsNotEmpty({
    message:
      'Please select a session type.',
  })
  @MaxLength(120)
  sessionType: string;

  /*
   * Individual sessions will always be
   * forced to capacity 1 in service.
   *
   * For Webinar admin can provide capacity.
   */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  capacity?: number;
}

/* =========================================================
   UPDATE ADMIN SESSION SLOT
========================================================= */

export class UpdateBookingSlotDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toUpperCase()
      : value,
  )
  @IsOptional()
  @IsString()
  @Matches(
    /^(0?[1-9]|1[0-2]):[0-5]\d\s?(AM|PM)$/i,
    {
      message:
        'Time must use format such as 11:00 AM.',
    },
  )
  timeSlot?: string;

  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim()
      : value,
  )
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sessionType?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  capacity?: number;

  @IsOptional()
  @IsIn([true, false])
  isActive?: boolean;
}