import { IsOptional, IsUUID, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInternDto {
  @ApiPropertyOptional({ example: '22222222-2222-2222-2222-222222222222' })
  @IsOptional()
  @IsUUID()
  team_id?: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;
}
