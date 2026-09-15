import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value.trim().toLowerCase()
    : value;

export class RegisterUserDto {
  @Transform(trimValue)
  @IsString()
  @IsNotEmpty({ message: 'Name is required.' })
  @MinLength(2, {
    message: 'Name must be at least 2 characters.',
  })
  @MaxLength(80)
  name: string;

  @Transform(normalizeEmail)
  @IsEmail(
    {},
    { message: 'Please enter a valid email address.' },
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

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+()\-\s]{7,24}$/, {
    message: 'Please enter a valid phone number.',
  })
  phone?: string;
}

export class LoginUserDto {
  @Transform(normalizeEmail)
  @IsEmail(
    {},
    { message: 'Please enter a valid email address.' },
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

export class UpdateUserProfileDto {
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MinLength(2, {
    message: 'Name must be at least 2 characters.',
  })
  @MaxLength(80)
  name?: string;

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+()\-\s]{7,24}$/, {
    message: 'Please enter a valid phone number.',
  })
  phone?: string;

  @IsOptional()
  @IsBoolean()
  notifyNewSessions?: boolean;
}

export class ChangeUserPasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  currentPassword: string;

  @IsString()
  @MinLength(8, {
    message:
      'New password must be at least 8 characters long.',
  })
  @MaxLength(128)
  newPassword: string;
}
