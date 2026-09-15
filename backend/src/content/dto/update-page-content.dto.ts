import { IsObject } from 'class-validator';

export class UpdatePageContentDto {
  @IsObject()
  data: Record<string, unknown>;
}
