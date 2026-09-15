import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NotificationDocument =
  HydratedDocument<Notification>;

export const NOTIFICATION_TYPES = [
  'new_session',
  'booking_confirmed',
  'booking_cancelled',
  'session_reminder',
  'general',
] as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[number];

@Schema({
  timestamps: true,
  collection: 'notifications',
})
export class Notification {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: String,
    enum: NOTIFICATION_TYPES,
    default: 'general',
  })
  type: NotificationType;

  @Prop({
    required: true,
    trim: true,
    maxlength: 160,
  })
  title: string;

  @Prop({
    trim: true,
    maxlength: 600,
  })
  body?: string;

  /*
   * Relative path on the public site the
   * notification should open, e.g. /book-session.
   */
  @Prop({
    trim: true,
    maxlength: 300,
  })
  link?: string;

  @Prop({
    default: false,
    index: true,
  })
  isRead: boolean;
}

export const NotificationSchema =
  SchemaFactory.createForClass(Notification);

NotificationSchema.index({
  userId: 1,
  createdAt: -1,
});
