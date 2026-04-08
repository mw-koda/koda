export class CreateIssueDto {
  repo_id!: string;
  github_issue_id!: string;
  title!: string;
  state!: 'open' | 'closed' | 'in_progress';
  created_at!: string;
  updated_at!: string;
  closed_at?: string | null;
  labels?: Record<string, unknown>[];
  raw_payload!: Record<string, unknown>;
}

export class UpdateIssueDto {
  title?: string;
  state?: 'open' | 'closed' | 'in_progress';
  updated_at?: string;
  closed_at?: string | null;
  labels?: Record<string, unknown>[];
  raw_payload?: Record<string, unknown>;
}

export class IssueFilterDto {
  repo_id?: string;
  state?: 'open' | 'closed' | 'in_progress';
  intern_id?: string;
  period_start?: string;
  period_end?: string;
  page?: number;
  limit?: number;
}
