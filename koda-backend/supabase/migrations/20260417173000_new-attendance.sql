create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  intern_id uuid not null references public.interns(id) on delete cascade,
  time_in timestamptz not null default now(),
  time_out timestamptz null,
  rendered_hours double precision null,
  created_at timestamptz not null default now()
);

-- Prevent multiple open sessions for same intern.
create unique index if not exists attendance_one_open_session_per_intern
  on public.attendance (intern_id)
  where time_out is null;

-- Prevent negative sessions.
alter table public.attendance
  drop constraint if exists attendance_time_out_after_time_in;

alter table public.attendance
  add constraint attendance_time_out_after_time_in
  check (time_out is null or time_out >= time_in);

