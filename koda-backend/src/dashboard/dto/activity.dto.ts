import { ApiProperty } from '@nestjs/swagger';

export type ActivityType =
  | 'report_submitted'
  | 'issue_opened'
  | 'issue_closed'
  | 'evaluation_added';

export class ActivityDto {
  @ApiProperty({ enum: ['report_submitted', 'issue_opened', 'issue_closed', 'evaluation_added'] })
  type!: ActivityType;
  @ApiProperty({ example: 'Intern submitted weekly report' })
  description!: string;
  @ApiProperty({ example: '2026-04-23T10:00:00.000Z' })
  date!: string;
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111', nullable: true })
  internId!: string | null;
  @ApiProperty({ example: '22222222-2222-2222-2222-222222222222', nullable: true })
  teamId!: string | null;
}
