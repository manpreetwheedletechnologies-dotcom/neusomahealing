import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChatMessageRole = 'user' | 'bot';

@Schema({ _id: false })
export class ChatMessage {
  @Prop({ required: true, enum: ['user', 'bot'] })
  role: ChatMessageRole;

  @Prop({ required: true, maxlength: 4000 })
  text: string;

  @Prop({ default: () => new Date() })
  at: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);

export type ChatConversationDocument = HydratedDocument<ChatConversation>;

@Schema({ timestamps: true, collection: 'chat_conversations' })
export class ChatConversation {
  // Generated client-side and stored in the visitor's browser so
  // repeat messages in the same session thread onto one conversation.
  @Prop({ required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ trim: true, maxlength: 80 })
  name?: string;

  @Prop({ trim: true, lowercase: true, maxlength: 160 })
  email?: string;

  @Prop({ type: [ChatMessageSchema], default: [] })
  messages: ChatMessage[];

  // 'new' means admin hasn't reviewed this conversation yet.
  // Any fresh visitor message flips it back to 'new'.
  @Prop({ default: 'new', enum: ['new', 'read'], index: true })
  status: 'new' | 'read';
}

export const ChatConversationSchema =
  SchemaFactory.createForClass(ChatConversation);

ChatConversationSchema.index({ updatedAt: -1 });
