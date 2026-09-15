import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubscriberDocument = HydratedDocument<Subscriber>;

@Schema({ timestamps: true, collection: 'subscribers' })
export class Subscriber {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 160,
    index: true,
  })
  email: string;

  @Prop({ default: 'website', trim: true, maxlength: 60 })
  source: string;

  @Prop({ default: true, index: true })
  active: boolean;
}

export const SubscriberSchema = SchemaFactory.createForClass(Subscriber);
