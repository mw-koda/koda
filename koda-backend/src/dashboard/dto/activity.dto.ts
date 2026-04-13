export type ActivityType =
  | 'report_submitted'
  | 'issue_opened'
  | 'issue_closed'
  | 'evaluation_added';

export class ActivityDto {
  type!: ActivityType;
  description!: string;
  date!: string;
  internId!: string | null;
  teamId!: string | null;
}
