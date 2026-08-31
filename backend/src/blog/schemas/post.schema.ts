import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PostDocument = HydratedDocument<Post>;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  excerpt: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  category: string;

  @Prop()
  featuredImage?: string;

  @Prop({ default: 'Sakshi Kashyap' })
  author: string;

  @Prop({ default: false })
  published: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);
