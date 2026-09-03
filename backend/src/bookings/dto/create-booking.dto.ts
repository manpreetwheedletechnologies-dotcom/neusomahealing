import { Transform } from 'class-transformer';
import {
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

export class CreateBookingDto {
  @Transform(trimValue)
  @IsString()
  @IsNotEmpty({ message: 'Name is required.' })
  @MinLength(2, { message: 'Name must be at least 2 characters.' })
  @MaxLength(80, { message: 'Name cannot exceed 80 characters.' })
  name: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(160)
  email: string;

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @Matches(/^[0-9+()\-\s]{7,24}$/, {
    message: 'Please enter a valid phone number.',
  })
  phone?: string;

  @Transform(trimValue)
@IsOptional()
@IsString()
@Matches(/^[a-fA-F0-9]{24}$/, {
  message: 'Invalid booking slot.',
})
slotId?: string;

 @Transform(trimValue)
@IsOptional()
@IsString()
@MaxLength(120)
sessionType?: string;

 @Transform(trimValue)
@IsOptional()
@IsString()
@Matches(/^\d{4}-\d{2}-\d{2}$/, {
  message:
    'Booking date must be in YYYY-MM-DD format.',
})
bookingDate?: string;

 @Transform(trimValue)
@IsOptional()
@IsString()
@MaxLength(30)
timeSlot?: string;

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters.' })
  message?: string;
}
