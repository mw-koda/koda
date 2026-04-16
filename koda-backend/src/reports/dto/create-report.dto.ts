import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsISO8601,
} from 'class-validator';

export class CreateReportDto {
  @IsUUID()
  intern_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsISO8601()
  period_start: string;

  @IsISO8601()
  period_end: string;

  @IsOptional()
  @IsISO8601()
  submitted_at?: string;
}
