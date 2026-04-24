import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateReportStatusDto {
  @ApiProperty({ enum: ['draft', 'submitted', 'reviewed'] })
  @IsIn(['draft', 'submitted', 'reviewed'])
  status: string;
}
