import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class AssignInternsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  internIds!: string[];
}
