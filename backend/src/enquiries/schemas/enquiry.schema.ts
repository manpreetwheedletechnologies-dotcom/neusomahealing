import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
} from 'mongoose';

export type EnquiryDocument =
  HydratedDocument<Enquiry>;

@Schema({
  timestamps: true,
  collection: 'enquiries',
})
export class Enquiry {
  @Prop({
    required: true,
    trim: true,
    maxlength: 80,
  })
  name: string;

  @Prop({
    required: true,
    lowercase: true,
    trim: true,
    maxlength: 160,
    index: true,
  })
  email: string;

  @Prop({
    trim: true,
    maxlength: 24,
  })
  phone?: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 120,
  })
  subject: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 2000,
  })
  message: string;

  @Prop({
    default: 'new',

    enum: [
      'new',
      'contacted',
      'booked',
      'closed',
    ],

    index: true,
  })
  status:
    | 'new'
    | 'contacted'
    | 'booked'
    | 'closed';
}

export const EnquirySchema =
  SchemaFactory.createForClass(
    Enquiry,
  );