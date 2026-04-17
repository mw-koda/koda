create or replace function public.koda_intern_performance_summary(p_intern_id uuid)
returns table (average_score double precision, count bigint)
language sql
stable
as $$
  select
    avg(pm.score)::double precision as average_score,
    count(*)::bigint as count
  from public.performance_metrics pm
  where pm.intern_id = p_intern_id;
$$;

create or replace function public.koda_team_performance_summary(
  p_team_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (overall_average double precision, count bigint)
language sql
stable
as $$
  select
    avg(pm.score)::double precision as overall_average,
    count(*)::bigint as count
  from public.performance_metrics pm
  join public.interns i on i.id = pm.intern_id
  where i.team_id = p_team_id
    and (p_from is null or pm.evaluated_at >= p_from)
    and (p_to is null or pm.evaluated_at <= p_to);
$$;

create or replace function public.koda_team_performance_trend(
  p_team_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_bucket text default 'week'
)
returns table (bucket_start timestamptz, average_score double precision, count bigint)
language sql
stable
as $$
  with filtered as (
    select
      pm.score,
      date_trunc(
        case when lower(p_bucket) = 'month' then 'month' else 'week' end,
        coalesce(pm.evaluated_at, pm.created_at)
      ) as bucket_start
    from public.performance_metrics pm
    join public.interns i on i.id = pm.intern_id
    where i.team_id = p_team_id
      and (p_from is null or pm.evaluated_at >= p_from)
      and (p_to is null or pm.evaluated_at <= p_to)
  )
  select
    filtered.bucket_start,
    avg(filtered.score)::double precision as average_score,
    count(*)::bigint as count
  from filtered
  group by filtered.bucket_start
  order by filtered.bucket_start asc;
$$;

