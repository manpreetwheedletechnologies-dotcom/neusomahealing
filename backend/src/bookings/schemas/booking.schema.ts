import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  HydratedDocument,
  SchemaTypes,
  Types,
} from 'mongoose';

export type BookingDocument = HydratedDocument<Booking>;

export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

@Schema({ timestamps: true, collection: 'bookings' })
export class Booking {
  @Prop({ required: true, trim: true, maxlength: 80 })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true, maxlength: 160 })
  email: string;

  @Prop({ trim: true, maxlength: 24 })
  phone?: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  sessionType: string;

  @Prop({ required: true, match: /^\d{4}-\d{2}-\d{2}$/ })
  bookingDate: string;

  @Prop({ required: true, trim: true, maxlength: 30 })
  timeSlot: string;

  /*
 * New booking-slot relation.
 *
 * Optional temporarily because existing
 * bookings in MongoDB don't have slotId.
 */
@Prop({
  type: SchemaTypes.ObjectId,
  ref: 'BookingSlot',
  index: true,
})
slotId?: Types.ObjectId;

@Prop({
  type: String,
  enum: ['individual', 'webinar'],
})
bookingMode?: 'individual' | 'webinar';

  /*
   * Zoom meeting snapshot for this booking.
   *
   * Admin dashboard can display the meeting
   * directly from the booking record.
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

  /*
   * Free Zoom flow:
   * backend sends the confirmation email.
   */
  @Prop({
    type: String,
    enum: [
      'pending',
      'sent',
      'failed',
    ],
  })
  emailStatus?:
    | 'pending'
    | 'sent'
    | 'failed';

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  emailLastError?: string;

/*
 * Prevent same email from registering for
 * the same active slot more than once.
 *
 * Unlike old activeSlotKey, multiple users
 * can book the same Webinar slot.
 */
@Prop({
  unique: true,
  sparse: true,
  index: true,
  select: false,
})
activeRegistrationKey?: string;

  @Prop({ trim: true, maxlength: 1000 })
  message?: string;

  @Prop({
    unique: true,
    sparse: true,
    index: true,
    select: false,
  })
  activeSlotKey?: string;

  @Prop({
    type: String,
    enum: BOOKING_STATUSES,
    default: 'pending',
    index: true,
  })
  status: BookingStatus;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ bookingDate: 1, createdAt: -1 });
BookingSchema.index({ email: 1, createdAt: -1 });
