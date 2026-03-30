create table teams (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_by uuid references users(id),
  created_at timestamp default now()
);