import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminDocument = HydratedDocument<Admin>;

@Schema({
  timestamps: true,
  collection: 'admins',
})
export class Admin {
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
  })
  email: string;

  @Prop({
    required: true,
    select: false,
  })
  passwordHash: string;

  @Prop({
    default: 'admin',
    enum: ['admin', 'superadmin'],
  })
  role: 'admin' | 'superadmin';

  @Prop({
    default: true,
  })
  isActive: boolean;

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

export const AdminSchema = SchemaFactory.createForClass(Admin);