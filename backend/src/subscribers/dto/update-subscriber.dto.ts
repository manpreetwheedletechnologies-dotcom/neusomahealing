import { IsBoolean } from 'class-validator';

export class UpdateSubscriberDto {
  @IsBoolean()
  active: boolean;
}
