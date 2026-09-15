import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TestimonialDocument = HydratedDocument<Testimonial>;

@Schema({ timestamps: true, collection: 'testimonials' })
export class Testimonial {
  @Prop({ required: true, trim: true, maxlength: 120 })
  name: string;

  @Prop({ required: true, trim: true, maxlength: 160 })
  type: string;

  @Prop({ required: true, trim: true, maxlength: 120, index: true })
  category: string;

  @Prop({ required: true, maxlength: 2000 })
  quote: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: false, index: true })
  published: boolean;
}

export const TestimonialSchema = SchemaFactory.createForClass(Testimonial);

TestimonialSchema.index({ order: 1 });
