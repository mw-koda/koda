create table interns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  team_id uuid references teams(id) on delete set null,
  created_at timestamp default now()
);