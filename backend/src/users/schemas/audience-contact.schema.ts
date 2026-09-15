import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AudienceContactDocument =
  HydratedDocument<AudienceContact>;

export const AUDIENCE_SOURCES = [
  'account',
  'booking',
  'enquiry',
  'newsletter',
  'chat',
  'other',
] as const;

export type AudienceSource =
  (typeof AUDIENCE_SOURCES)[number];

/*
 * One row per human, deduped by email.
 *
 * Every form on the site funnels into this
 * collection — contact enquiries, newsletter
 * signups, bookings, chat and account signups.
 * It's the single list used when the admin
 * announces a new session, so people who never
 * created an account still hear about it.
 */
@Schema({
  timestamps: true,
  collection: 'audience_contacts',
})
export class AudienceContact {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    maxlength: 160,
  })
  email: string;

  @Prop({
    trim: true,
    maxlength: 80,
  })
  name?: string;

  @Prop({
    trim: true,
    maxlength: 24,
  })
  phone?: string;

  /*
   * Every form this person has ever come through.
   * Kept as a set so admin can see, e.g., someone
   * who subscribed AND later booked.
   */
  @Prop({
    type: [String],
    default: [],
  })
  sources: AudienceSource[];

  /*
   * Opt-out for session announcements. Non-account
   * holders toggle this through the tokenised
   * unsubscribe link in the email footer.
   */
  @Prop({
    default: true,
    index: true,
  })
  isSubscribed: boolean;

  /*
   * Random per-contact token so an unsubscribe link
   * can't be guessed or enumerated from an email.
   */
  @Prop({
    required: true,
    index: true,
  })
  unsubscribeToken: string;

  /*
   * True once this email also registers a full
   * account. Those people get in-app notifications
   * as well, so the mailer can avoid double-sending
   * if that's ever desired.
   */
  @Prop({
    default: false,
  })
  hasAccount: boolean;

  @Prop({
    default: null,
  })
  lastSeenAt: Date | null;
}

export const AudienceContactSchema =
  SchemaFactory.createForClass(AudienceContact);
