import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsISO8601,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReportDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  @IsUUID()
  intern_id: string;

  @ApiProperty({ example: 'Weekly progress report' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Completed onboarding tasks.' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsISO8601()
  period_start: string;

  @ApiProperty({ example: '2026-04-07' })
  @IsISO8601()
  period_end: string;

  @ApiPropertyOptional({ example: '2026-04-07T12:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  submitted_at?: string;
}
