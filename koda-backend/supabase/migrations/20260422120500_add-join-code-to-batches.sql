alter table public.batches
  add column if not exists join_code text;

update public.batches
set join_code = upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
where join_code is null or join_code = '';

alter table public.batches
  alter column join_code set not null;

create unique index if not exists batches_join_code_key
  on public.batches (join_code);
