import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class SendChatMessageDto {
  // Generated once per browser session on the frontend
  // (e.g. stored in localStorage) so a visitor's messages
  // thread together into one conversation.
  @Transform(trimString)
  @IsString()
  @MinLength(6)
  @MaxLength(120)
  sessionId: string;

  @Transform(trimString)
  @IsString()
  @MinLength(1, { message: 'Message cannot be empty.' })
  @MaxLength(2000, { message: 'Message cannot exceed 2000 characters.' })
  message: string;

  @Transform(trimString)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsOptional()
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  @MaxLength(160)
  email?: string;
}
