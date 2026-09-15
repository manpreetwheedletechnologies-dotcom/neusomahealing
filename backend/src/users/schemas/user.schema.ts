import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

/*
 * Site visitor account — completely separate from
 * the Admin collection. Admins manage the site;
 * users book sessions and view their own history.
 */
@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({
    required: true,
    trim: true,
    maxlength: 80,
  })
  name: string;

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
    required: true,
    select: false,
  })
  passwordHash: string;

  @Prop({
    trim: true,
    maxlength: 24,
  })
  phone?: string;

  @Prop({
    default: true,
  })
  isActive: boolean;

  /*
   * Opt-out switch for the "new session/webinar
   * announced" emails. In-app notifications are
   * always created; only email delivery respects
   * this flag.
   */
  @Prop({
    default: true,
  })
  notifyNewSessions: boolean;

  @Prop({
    default: 0,
    select: false,
  })
  failedLoginAttempts: number;

  @Prop({
    default: null,
    select: false,
  })
  lockUntil: Date | null;

  @Prop({
    default: null,
  })
  lastLogin: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
