import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignInternsDto {
  @ApiProperty({ type: [String], example: ['8f6d3c5a-1111-2222-3333-444455556666'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  internIds!: string[];
}
