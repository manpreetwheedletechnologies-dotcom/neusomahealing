import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CoachingProgramDocument = HydratedDocument<CoachingProgram>;

@Schema({ timestamps: true, collection: 'coaching_programs' })
export class CoachingProgram {
  @Prop({ required: true, trim: true, maxlength: 160 })
  title: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true, maxlength: 160 })
  slug: string;

  @Prop({ required: true, trim: true, maxlength: 240 })
  tagline: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  details: string[];

  @Prop({ type: [String], default: [] })
  explore: string[];

  @Prop({ required: true })
  expect: string;

  @Prop()
  image?: string;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: false, index: true })
  published: boolean;
}

export const CoachingProgramSchema = SchemaFactory.createForClass(CoachingProgram);

CoachingProgramSchema.index({ order: 1 });
