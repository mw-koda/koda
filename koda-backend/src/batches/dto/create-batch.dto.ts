import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBatchDto {
  @ApiProperty({ example: 'Batch 12' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Frontend internship cohort' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-01-01' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ example: '2026-06-30' })
  @IsDateString()
  endDate!: string;

  @ApiProperty({ example: 25 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxInterns!: number;

  @ApiPropertyOptional({ example: 'ABC123' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{6,}$/, {
    message:
      'joinCode must be uppercase alphanumeric with at least 6 characters',
  })
  joinCode?: string;
}
