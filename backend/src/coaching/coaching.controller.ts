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
import { CoachingService } from './coaching.service';
import { CoachingProgram } from './schemas/coaching-program.schema';

@Controller('coaching')
export class CoachingController {
  constructor(private readonly coachingService: CoachingService) {}

  // Admin only — must be declared before ':slug' so it isn't
  // captured as a slug parameter.
  @Get('admin/all')
  @UseGuards(AdminAuthGuard)
  findAllForAdmin() {
    return this.coachingService.findAllForAdmin();
  }

  @Post()
  @UseGuards(AdminAuthGuard)
  create(@Body() data: Partial<CoachingProgram>) {
    return this.coachingService.create(data);
  }

  @Get()
  findAll() {
    return this.coachingService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.coachingService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  update(@Param('id') id: string, @Body() data: Partial<CoachingProgram>) {
    return this.coachingService.update(id, data);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.coachingService.remove(id);
  }
}
