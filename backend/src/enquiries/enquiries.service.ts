import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectModel,
} from '@nestjs/mongoose';

import {
  Model,
  Types,
} from 'mongoose';

import {
  CreateEnquiryDto,
} from './dto/create-enquiry.dto';

import {
  EnquiryStatus,
} from './dto/update-enquiry-status.dto';

import {
  Enquiry,
  EnquiryDocument,
} from './schemas/enquiry.schema';

import { AudienceService } from '../users/audience.service';

@Injectable()
export class EnquiriesService {
  constructor(
    @InjectModel(
      Enquiry.name,
    )
    private readonly enquiryModel:
      Model<EnquiryDocument>,

    private readonly audienceService:
      AudienceService,
  ) {}

  async create(
    dto: CreateEnquiryDto,
  ) {
    try {
      const enquiry =
        await this.enquiryModel.create(
          {
            name:
              dto.name,

            email:
              dto.email,

            phone:
              dto.phone ||
              undefined,

            subject:
              dto.subject,

            message:
              dto.message,

            status:
              'new',
          },
        );

      /*
       * Anyone who contacts us joins the shared
       * announcement list, so they hear about new
       * sessions even without an account.
       */
      await this.audienceService.capture({
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        source: 'enquiry',
      });

      return {
        success: true,

        message:
          'Thank you for reaching out. Your message has been received and we will get back to you soon.',

        data: {
          id:
            enquiry._id.toString(),

          status:
            'new' as const,
        },
      };
    } catch {
      throw new InternalServerErrorException(
        'Your message could not be saved right now. Please try again shortly.',
      );
    }
  }

  async findAll() {
    const enquiries =
      await this.enquiryModel
        .find()
        .sort({
          createdAt: -1,
        })
        .lean()
        .exec();

    return {
      success: true,
      data: enquiries,
    };
  }

  async countStats() {
    const [total, newCount] = await Promise.all([
      this.enquiryModel.countDocuments().exec(),
      this.enquiryModel.countDocuments({ status: 'new' }).exec(),
    ]);

    return { total, new: newCount };
  }

  async updateStatus(
    id: string,
    status:
      EnquiryStatus,
  ) {
    if (
      !Types.ObjectId.isValid(
        id,
      )
    ) {
      throw new BadRequestException(
        'Invalid enquiry id.',
      );
    }

    const updated =
      await this.enquiryModel
        .findByIdAndUpdate(
          id,
          {
            status,
          },
          {
            new: true,
            runValidators: true,
          },
        )
        .lean()
        .exec();

    if (!updated) {
      throw new NotFoundException(
        'Enquiry not found.',
      );
    }

    return {
      success: true,

      message:
        'Enquiry status updated successfully.',

      data:
        updated,
    };
  }
}