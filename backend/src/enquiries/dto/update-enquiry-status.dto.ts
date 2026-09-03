import {
  IsIn,
} from 'class-validator';

export const ENQUIRY_STATUSES =
  [
    'new',
    'contacted',
    'booked',
    'closed',
  ] as const;

export type EnquiryStatus =
  (typeof ENQUIRY_STATUSES)[number];

export class UpdateEnquiryStatusDto {
  @IsIn(
    ENQUIRY_STATUSES,
    {
      message:
        'Status must be one of: new, contacted, booked, closed.',
    },
  )
  status: EnquiryStatus;
}