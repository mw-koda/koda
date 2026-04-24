import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Frontend Team' })
  @IsString()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: '22222222-2222-2222-2222-222222222222' })
  @IsUUID()
  batchId!: string;

  @ApiPropertyOptional({ example: 'Handles UI work' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: '33333333-3333-3333-3333-333333333333' })
  @IsOptional()
  @IsUUID()
  teamLeadId?: string;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxInterns?: number;
}
