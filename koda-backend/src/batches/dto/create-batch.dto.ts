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

export class CreateBatchDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxInterns!: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z0-9]{6,}$/, {
    message:
      'joinCode must be uppercase alphanumeric with at least 6 characters',
  })
  joinCode?: string;
}
