import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ContentService } from './content.service';
import { UpdatePageContentDto } from './dto/update-page-content.dto';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // Admin only — lists every page-content key/value pair.
  @Get()
  @UseGuards(AdminAuthGuard)
  findAll() {
    return this.contentService.findAll();
  }

  // Public — lets the website read a specific content block
  // without requiring admin auth.
  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.contentService.findOne(key);
  }

  // Admin only — creates the key if it doesn't exist yet.
  @Put(':key')
  @UseGuards(AdminAuthGuard)
  upsert(@Param('key') key: string, @Body() dto: UpdatePageContentDto) {
    return this.contentService.upsert(key, dto.data);
  }
}
