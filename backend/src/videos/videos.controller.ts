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
import { VideosService } from './videos.service';
import { Video } from './schemas/video.schema';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // Admin only — declared before any future ':id' GET route.
  @Get('admin/all')
  @UseGuards(AdminAuthGuard)
  findAllForAdmin() {
    return this.videosService.findAllForAdmin();
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  create(@Body() data: Partial<Video>) {
    return this.videosService.create(data);
  }

  @Get()
  findAll() {
    return this.videosService.findAll();
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  update(@Param('id') id: string, @Body() data: Partial<Video>) {
    return this.videosService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.videosService.remove(id);
  }
}
