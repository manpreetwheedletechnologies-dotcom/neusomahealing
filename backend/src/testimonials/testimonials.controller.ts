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
import { TestimonialsService } from './testimonials.service';
import { Testimonial } from './schemas/testimonial.schema';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  // Admin only — declared before any future ':id' GET route.
  @Get('admin/all')
  @UseGuards(AdminAuthGuard)
  findAllForAdmin() {
    return this.testimonialsService.findAllForAdmin();
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  create(@Body() data: Partial<Testimonial>) {
    return this.testimonialsService.create(data);
  }

  @Get()
  findAll() {
    return this.testimonialsService.findAll();
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  update(@Param('id') id: string, @Body() data: Partial<Testimonial>) {
    return this.testimonialsService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.testimonialsService.remove(id);
  }
}
