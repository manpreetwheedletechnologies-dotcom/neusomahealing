import {
  IsEmail,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

import { Transform } from 'class-transformer';

export class LoginAdminDto {
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.trim().toLowerCase()
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

  @IsString()
  @MinLength(8, {
    message:
      'Password must be at least 8 characters long.',
  })
  @MaxLength(128)
  password: string;
}