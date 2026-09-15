import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class SubscribeDto {
  @Transform(trimValue)
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(160)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  source?: string;
}
