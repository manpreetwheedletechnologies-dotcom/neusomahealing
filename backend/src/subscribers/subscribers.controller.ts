import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { SubscribersService } from './subscribers.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';

@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly subscribersService: SubscribersService) {}

  // Public website newsletter form.
  @Post()
  subscribe(@Body() dto: SubscribeDto) {
    return this.subscribersService.subscribe(dto.email, dto.source);
  }

  // Admin only
  @Get()
  @UseGuards(AdminAuthGuard)
  findAll() {
    return this.subscribersService.findAll();
  }

  // Admin only
  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateSubscriberDto) {
    return this.subscribersService.update(id, dto.active);
  }

  // Admin only
  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.subscribersService.remove(id);
  }
}
