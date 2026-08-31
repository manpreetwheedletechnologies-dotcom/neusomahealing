import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { Video } from './schemas/video.schema';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Post()
  create(@Body() data: Partial<Video>) {
    return this.videosService.create(data);
  }

  @Get()
  findAll() {
    return this.videosService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: Partial<Video>) {
    return this.videosService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.videosService.remove(id);
  }
}
