import { IsIn } from 'class-validator';

export type ChatConversationStatus = 'new' | 'read';

export class UpdateChatStatusDto {
  @IsIn(['new', 'read'], { message: 'Status must be new or read.' })
  status: ChatConversationStatus;
}
