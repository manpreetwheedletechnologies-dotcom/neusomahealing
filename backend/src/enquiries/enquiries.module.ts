import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  AuthModule,
} from '../auth/auth.module';

import {
  EnquiriesController,
} from './enquiries.controller';

import {
  EnquiriesService,
} from './enquiries.service';

import {
  Enquiry,
  EnquirySchema,
} from './schemas/enquiry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name:
          Enquiry.name,

        schema:
          EnquirySchema,
      },
    ]),

    AuthModule,
  ],

  controllers: [
    EnquiriesController,
  ],

  providers: [
    EnquiriesService,
  ],
})
export class EnquiriesModule {}