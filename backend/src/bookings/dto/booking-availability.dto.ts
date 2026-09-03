import { Transform } from 'class-transformer';

import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trimValue = ({
  value,
}: {
  value: unknown;
}) =>
  typeof value === 'string'
    ? value.trim()
    : value;

export class BookingAvailabilityDto {
  @Transform(trimValue)
  @IsString()
  @Matches(
    /^\d{4}-\d{2}-\d{2}$/,
    {
      message:
        'Date must be in YYYY-MM-DD format.',
    },
  )
  date: string;

  /*
   * Selected session from public
   * booking page.
   *
   * Example:
   * Discovery Call
   * Webinar
   */
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  sessionType?: string;
}