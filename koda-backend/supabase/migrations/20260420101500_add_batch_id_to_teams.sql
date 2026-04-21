alter table public.teams
  add column if not exists batch_id uuid references public.batches(id) on delete cascade;

create index if not exists teams_batch_id_idx on public.teams(batch_id);

-- Backfill unambiguous teams where member interns all map to one batch.
with inferred_batch as (
  select
    t.id as team_id,
    min(bi.batch_id) as batch_id,
    count(distinct bi.batch_id) as batch_count
  from public.teams t
  join public.team_members tm on tm.team_id = t.id
  join public.interns i on i.user_id = tm.user_id
  join public.batch_interns bi on bi.intern_id = i.id
  where t.batch_id is null
  group by t.id
)
update public.teams t
set batch_id = inferred_batch.batch_id
from inferred_batch
where t.id = inferred_batch.team_id
  and inferred_batch.batch_count = 1
  and t.batch_id is null;

-- Optional follow-up (after manual cleanup):
-- alter table public.teams alter column batch_id set not null;
-- create unique index if not exists teams_creator_batch_name_uidx
--   on public.teams(created_by, batch_id, lower(name));
