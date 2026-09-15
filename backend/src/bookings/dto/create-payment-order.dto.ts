import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePaymentOrderDto {
  @Transform(trimValue)
  @IsString()
  @IsNotEmpty({ message: 'Please select a session type.' })
  @MaxLength(120)
  sessionType: string;

  @Transform(trimValue)
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Booking date must be in YYYY-MM-DD format.',
  })
  bookingDate: string;

  @Transform(trimValue)
  @IsString()
  @MaxLength(30)
  timeSlot: string;

  /*
   * Optional: identifies the exact slot the
   * customer picked. When present, used to look
   * up the slot directly instead of by
   * date+time+sessionType alone.
   */
  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MaxLength(64)
  slotId?: string;
}
