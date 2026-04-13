import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreatePerformanceDto {
  @IsUUID('all')
  internId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score!: number;

  @IsOptional()
  @IsUUID('all')
  reportId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  evaluatedAt?: string;

  @IsOptional()
  @IsObject()
  dimensions?: Record<string, number>;
}
