import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ChatService } from './chat.service';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { UpdateChatStatusDto } from './dto/update-chat-status.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Public — the chat widget on the website.
  @Post('message')
  sendMessage(@Body() dto: SendChatMessageDto) {
    return this.chatService.sendMessage(dto);
  }

  // Admin only — full conversation list for the dashboard.
  @Get('admin/all')
  @UseGuards(AdminAuthGuard)
  findAll() {
    return this.chatService.findAll();
  }

  // Admin only — mark a conversation read/new.
  @Patch('admin/:id/status')
  @UseGuards(AdminAuthGuard)
  updateStatus(@Param('id') id: string, @Body() dto: UpdateChatStatusDto) {
    return this.chatService.updateStatus(id, dto.status);
  }
}
