import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookingSlotDocument =
  HydratedDocument<BookingSlot>;

export const BOOKING_MODES = [
  'individual',
  'webinar',
] as const;

export type BookingMode =
  (typeof BOOKING_MODES)[number];

@Schema({
  timestamps: true,
  collection: 'booking_slots',
})
export class BookingSlot {
  @Prop({
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
    index: true,
  })
  bookingDate: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 30,
  })
  timeSlot: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 120,
    index: true,
  })
  sessionType: string;

  @Prop({
    type: String,
    enum: BOOKING_MODES,
    required: true,
  })
  bookingMode: BookingMode;

  /*
   * Individual session => always 1
   * Webinar => admin controlled.
   */
  @Prop({
    required: true,
    min: 1,
    default: 1,
  })
  capacity: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  bookedCount: number;

  /*
   * Atomic booking ke liye important.
   *
   * Booking:
   * remainingSeats > 0
   * then atomic -1.
   */
  @Prop({
    required: true,
    min: 0,
    default: 1,
    index: true,
  })
  remainingSeats: number;

  @Prop({
    default: true,
    index: true,
  })
  isActive: boolean;

    /*
   * One BookingSlot = one Zoom meeting.
   *
   * Individual:
   * one slot -> one customer -> one meeting
   *
   * Webinar:
   * one slot -> multiple customers -> same meeting
   */
  @Prop({
    trim: true,
    maxlength: 100,
  })
  zoomMeetingId?: string;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  zoomJoinUrl?: string;

  @Prop({
    type: String,
    enum: [
      'not_created',
      'creating',
      'scheduled',
      'failed',
    ],
    default: 'not_created',
    index: true,
  })
  zoomStatus?:
    | 'not_created'
    | 'creating'
    | 'scheduled'
    | 'failed';

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  zoomLastError?: string;
}

 export const BookingSlotSchema =
  SchemaFactory.createForClass(BookingSlot);

/*
 * Same date + same time par ek hi actual
 * host session allowed.
 *
 * Webinar me multiple people usi slot ko
 * join karenge; multiple slots nahi banenge.
 */
BookingSlotSchema.index(
  {
    bookingDate: 1,
    timeSlot: 1,
  },
  {
    unique: true,
  },
);

BookingSlotSchema.index({
  bookingDate: 1,
  isActive: 1,
  remainingSeats: 1,
});