import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserSessionDocument =
  HydratedDocument<UserSession>;

@Schema({
  timestamps: true,
  collection: 'user_sessions',
})
export class UserSession {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    index: true,
  })
  tokenHash: string;

  @Prop({
    required: true,
  })
  expiresAt: Date;
}

export const UserSessionSchema =
  SchemaFactory.createForClass(UserSession);

// Mongo drops expired sessions on its own.
UserSessionSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 },
);
