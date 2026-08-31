import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type VideoDocument = HydratedDocument<Video>;

@Schema({ timestamps: true })
export class Video {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  thumbnail?: string;

  @Prop({ required: true })
  category: string; // hrt | nervous | selftrust | midlife ...

  @Prop()
  duration?: string;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: true })
  published: boolean;
}

export const VideoSchema = SchemaFactory.createForClass(Video);
