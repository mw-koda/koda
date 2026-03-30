create table performance_metrics (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid references interns(id) on delete cascade,
  report_id uuid references reports(id) on delete cascade,
  score int,
  feedback text,
  evaluated_at timestamp default now()
);