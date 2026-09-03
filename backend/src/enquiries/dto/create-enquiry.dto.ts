import {
  Transform,
} from 'class-transformer';

import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimString = ({
  value,
}: {
  value: unknown;
}) =>
  typeof value === 'string'
    ? value.trim()
    : value;

export class CreateEnquiryDto {
  @Transform(trimString)
  @IsString()
  @MinLength(2, {
    message:
      'Name must be at least 2 characters long.',
  })
  @MaxLength(80, {
    message:
      'Name cannot exceed 80 characters.',
  })
  name: string;

  @Transform(
    ({ value }) =>
      typeof value ===
      'string'
        ? value
            .trim()
            .toLowerCase()
        : value,
  )
  @IsEmail(
    {},
    {
      message:
        'Please enter a valid email address.',
    },
  )
  @MaxLength(160)
  email: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  @Matches(
    /^[0-9+()\-\s]{7,24}$/,
    {
      message:
        'Please enter a valid phone number.',
    },
  )
  phone?: string;

  @Transform(trimString)
  @IsString()
  @MinLength(2, {
    message:
      'Subject must be at least 2 characters long.',
  })
  @MaxLength(120)
  subject: string;

  @Transform(trimString)
  @IsString()
  @MinLength(10, {
    message:
      'Message must be at least 10 characters long.',
  })
  @MaxLength(2000, {
    message:
      'Message cannot exceed 2000 characters.',
  })
  message: string;
}