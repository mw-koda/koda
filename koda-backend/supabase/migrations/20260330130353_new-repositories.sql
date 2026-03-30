create table repositories (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  github_repo_id text,
  name text,
  owner text,
  url text
);