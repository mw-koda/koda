create table issue_assignments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid references issues(id) on delete cascade,
  intern_id uuid references interns(id) on delete cascade,
  manual boolean default false,
  assigned_at timestamp default now()
);