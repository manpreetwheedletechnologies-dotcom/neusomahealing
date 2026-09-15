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
  /*
   * Account that made this booking.
   *
   * Optional because bookings created before user
   * accounts existed have no owner. New bookings
   * always set it — the booking endpoints require
   * a signed-in user.
   */
  @Prop({
    type: SchemaTypes.ObjectId,
    ref: 'User',
    index: true,
  })
  userId?: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 80 })
  name: string;

  @Prop({ required: true, lowercase: true, trim: true, maxlength: 160 })
  email: string;

  @Prop({ trim: true, maxlength: 24 })
  phone?: string;

  @Prop({ required: true, trim: true, maxlength: 120 })
  sessionType: string;

  /*
   * Optional now.
   *
   * Discovery Call / Coaching / Deep Transformation
   * requests are created WITHOUT a confirmed date —
   * admin assigns bookingDate/timeSlot later via
   * assignSession(). Webinar + legacy slot-based
   * bookings still set this at creation time.
   */
  @Prop({ match: /^\d{4}-\d{2}-\d{2}$/ })
  bookingDate?: string;

  @Prop({ trim: true, maxlength: 30 })
  timeSlot?: string;

  /*
   * User-suggested date/time, captured at request
   * time. Purely informational for admin — the
   * actual scheduled session always comes from
   * bookingDate/timeSlot above, set by admin.
   */
  @Prop({ match: /^\d{4}-\d{2}-\d{2}$/ })
  preferredDate?: string;

  @Prop({ trim: true, maxlength: 30 })
  preferredTimeSlot?: string;

  /*
   * true  => bookingDate/timeSlot are the final,
   *          confirmed session time (slot-based
   *          bookings, webinars, or after admin
   *          has assigned an individual request).
   * false => this is a request/lead waiting for
   *          admin to assign a real date/time.
   *
   * Defaults to true so existing slot-based
   * bookings in MongoDB keep working unchanged.
   */
  @Prop({ default: true })
  isAssigned?: boolean;

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

  /*
   * Razorpay payment snapshot.
   *
   * paymentStatus stays 'not_required' for
   * free sessions (price 0) so existing free
   * bookings keep working unchanged.
   */
  @Prop({
    type: String,
    enum: ['not_required', 'paid', 'failed'],
    default: 'not_required',
  })
  paymentStatus?: 'not_required' | 'paid' | 'failed';

  @Prop({ min: 0 })
  amountPaid?: number;

  @Prop({ trim: true, maxlength: 100 })
  razorpayOrderId?: string;

  @Prop({ trim: true, maxlength: 100 })
  razorpayPaymentId?: string;

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
BookingSchema.index({ userId: 1, createdAt: -1 });
