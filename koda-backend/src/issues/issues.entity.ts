export interface Issue {
  id: string;
  repo_id: string;
  github_issue_id: string;
  title: string;
  state: 'open' | 'closed' | 'in_progress';
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  labels: Record<string, unknown>[];
  raw_payload: Record<string, unknown>;
}
