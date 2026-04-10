import { IsIn } from 'class-validator';

export class UpdateReportStatusDto {
  @IsIn(['draft', 'submitted', 'reviewed'])
  status: string;
}