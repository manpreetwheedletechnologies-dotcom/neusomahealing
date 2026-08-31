import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEnquiryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
