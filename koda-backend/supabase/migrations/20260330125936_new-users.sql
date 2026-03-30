create table users (
  id uuid primary key default gen_random_uuid(),
  github_id text,
  github_username text,
  name text,
  email text unique,
  role text,
  created_at timestamp default now()
);