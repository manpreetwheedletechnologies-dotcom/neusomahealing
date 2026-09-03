import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  AdminAuthGuard,
} from '../auth/admin-auth.guard';

import {
  CreateEnquiryDto,
} from './dto/create-enquiry.dto';

import {
  UpdateEnquiryStatusDto,
} from './dto/update-enquiry-status.dto';

import {
  EnquiriesService,
} from './enquiries.service';

@Controller('enquiries')
export class EnquiriesController {
  constructor(
    private readonly enquiriesService:
      EnquiriesService,
  ) {}

  // Public website form
  @Post()
  create(
    @Body()
    dto:
      CreateEnquiryDto,
  ) {
    return this.enquiriesService.create(
      dto,
    );
  }

  // Admin only
  @Get()
  @UseGuards(
    AdminAuthGuard,
  )
  findAll() {
    return this.enquiriesService.findAll();
  }

  // Admin only
  @Patch(':id/status')
  @UseGuards(
    AdminAuthGuard,
  )
  updateStatus(
    @Param('id')
    id: string,

    @Body()
    dto:
      UpdateEnquiryStatusDto,
  ) {
    return this.enquiriesService.updateStatus(
      id,
      dto.status,
    );
  }
}