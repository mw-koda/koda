create table issues (
  id uuid primary key default gen_random_uuid(),
  repo_id uuid references repositories(id) on delete cascade,
  github_issue_id text,
  title text,
  state text,
  created_at timestamp,
  updated_at timestamp,
  closed_at timestamp,
  labels jsonb,
  raw_payload jsonb
);