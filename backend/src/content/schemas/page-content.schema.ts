import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes } from 'mongoose';

export type PageContentDocument = HydratedDocument<PageContent>;

@Schema({ timestamps: true, collection: 'page_content' })
export class PageContent {
  @Prop({ required: true, unique: true, trim: true, maxlength: 120 })
  key: string;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  data: Record<string, unknown>;
}

export const PageContentSchema = SchemaFactory.createForClass(PageContent);
