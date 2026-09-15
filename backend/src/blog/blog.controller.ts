import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post as HttpPost,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { BlogService } from './blog.service';
import { Post } from './schemas/post.schema';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // Admin only — must be declared before ':slug' to avoid being
  // swallowed by the public single-post route.
  @Get('admin/all')
  @UseGuards(AdminAuthGuard)
  findAllForAdmin() {
    return this.blogService.findAllForAdmin();
  }

  @HttpPost()
  @UseGuards(AdminAuthGuard)
  create(@Body() data: Partial<Post>) {
    return this.blogService.create(data);
  }

  @Get()
  findAll() {
    return this.blogService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  update(@Param('id') id: string, @Body() data: Partial<Post>) {
    return this.blogService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.blogService.remove(id);
  }
}
