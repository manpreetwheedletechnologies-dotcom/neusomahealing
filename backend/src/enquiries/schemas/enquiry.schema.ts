import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EnquiryDocument = HydratedDocument<Enquiry>;

@Schema({ timestamps: true })
export class Enquiry {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  phone?: string;

  @Prop({ required: true })
  message: string;

  @Prop({ default: 'new' })
  status: string; // new | contacted | booked | closed
}

export const EnquirySchema = SchemaFactory.createForClass(Enquiry);
