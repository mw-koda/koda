create table reports (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid references interns(id) on delete cascade,
  title text,
  content text,
  period_start timestamp,
  period_end timestamp,
  submitted_at timestamp default now(),
  status text
);