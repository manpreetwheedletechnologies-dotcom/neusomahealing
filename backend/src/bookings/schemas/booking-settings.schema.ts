import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookingSettingsDocument = HydratedDocument<BookingSettings>;

/* =========================================================
   SESSION TYPE
========================================================= */

@Schema({ _id: false })
export class SessionTypeOption {
  @Prop({
    required: true,
    trim: true,
  })
  title: string;

  @Prop({
    required: true,
    trim: true,
  })
  duration: string;

  @Prop({
    type: String,
    enum: ['individual', 'webinar'],
    default: 'individual',
  })
  bookingMode: 'individual' | 'webinar';

  /*
   * Individual => 1
   * Webinar => suggested/default capacity.
   */
  @Prop({
    min: 1,
    default: 1,
  })
  defaultCapacity: number;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const SessionTypeOptionSchema =
  SchemaFactory.createForClass(SessionTypeOption);

/* =========================================================
   ADMIN-CONTROLLED DATE SLOTS
========================================================= */

@Schema({ _id: false })
export class BookingDateSlotOption {
  @Prop({
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  })
  bookingDate: string;

  @Prop({
    type: [String],
    default: [],
  })
  timeSlots: string[];

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const BookingDateSlotOptionSchema =
  SchemaFactory.createForClass(BookingDateSlotOption);

/* =========================================================
   BOOKING SETTINGS
========================================================= */

@Schema({
  timestamps: true,
  collection: 'booking_settings',
})
export class BookingSettings {
  @Prop({
    required: true,
    unique: true,
    default: 'default',
    index: true,
  })
  key: string;

  @Prop({
    type: [SessionTypeOptionSchema],
    default: [],
  })
  sessionTypes: SessionTypeOption[];

  /*
   * Existing global slots retained for
   * backward compatibility.
   */
  @Prop({
    type: [String],
    default: [],
  })
  timeSlots: string[];

  /*
   * New:
   * Actual dates + times explicitly
   * opened by the admin.
   */
  @Prop({
    type: [BookingDateSlotOptionSchema],
    default: [],
  })
  dateSlots: BookingDateSlotOption[];

  @Prop({
    default: 'Asia/Kolkata',
  })
  timezone: string;

  @Prop({
    default: 6,
    min: 1,
    max: 12,
  })
  maxMonthsAhead: number;

  /*
   * Existing field retained.
   * Public calendar will later use dateSlots
   * instead of this field.
   */
  @Prop({
    type: [Number],
    default: [0, 1, 2, 3, 4, 5, 6],
  })
  activeWeekdays: number[];
}

export const BookingSettingsSchema =
  SchemaFactory.createForClass(BookingSettings);