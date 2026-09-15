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

/*
 * Used by Discovery Call, 1:1 Coaching and
 * Deep Transformation forms on the public site.
 *
 * Unlike CreateBookingDto (slot-based, e.g. Webinar),
 * this does NOT require an existing BookingSlot —
 * the user just submits their details and a
 * preferred date/time. Admin assigns the real
 * bookingDate/timeSlot afterwards.
 */
export class CreateIndividualRequestDto {
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
  @IsString()
  @IsNotEmpty({ message: 'Please select a session type.' })
  @MaxLength(120)
  sessionType: string;

  /*
   * User-suggested date. Not validated against
   * admin availability — admin has final say.
   */
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Preferred date must be in YYYY-MM-DD format.',
  })
  preferredDate?: string;

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  preferredTimeSlot?: string;

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters.' })
  message?: string;
}
