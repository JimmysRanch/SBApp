-- Reports metrics aggregation helpers
-- NOTE: PostgREST expects function arguments in lexical order when routing RPC calls,
-- so keep parameters alphabetically ordered (end_date before start_date, etc.).
create or replace function public.reports_appointment_metrics(
  end_date timestamptz default null,
  start_date timestamptz default null
)
returns table (
  total_appointments bigint,
  completed bigint,
  canceled bigint,
  no_show bigint,
  revenue numeric,
  expected_revenue numeric
)
language sql
security definer
set search_path = public
as $$
  with filtered as (
    select *
    from public.appointments a
    where (start_date is null or a.start_time >= start_date)
      and (end_date is null or a.start_time < end_date)
  )
  select
    count(*)::bigint as total_appointments,
    count(*) filter (where a.status ilike 'completed')::bigint as completed,
    count(*) filter (where a.status ilike 'cancel%')::bigint as canceled,
    count(*) filter (where a.status ilike 'no%show%')::bigint as no_show,
    coalesce(sum(case when a.status ilike 'completed' then coalesce(a.price, 0)::numeric else 0 end), 0)::numeric as revenue,
    coalesce(sum(coalesce(a.price, 0)::numeric), 0)::numeric as expected_revenue
  from filtered a;
$$;

create or replace function public.reports_top_services(
  end_date timestamptz default null,
  limit_count integer default 3,
  start_date timestamptz default null
)
returns table (
  service text,
  appointment_count bigint
)
language sql
security definer
set search_path = public
as $$
  with filtered as (
    select *
    from public.appointments a
    where (start_date is null or a.start_time >= start_date)
      and (end_date is null or a.start_time < end_date)
  )
  select
    coalesce(nullif(trim(a.service), ''), 'Other') as service,
    count(*)::bigint as appointment_count
  from filtered a
  group by coalesce(nullif(trim(a.service), ''), 'Other')
  order by appointment_count desc, service asc
  limit greatest(coalesce(limit_count, 0), 0);
$$;

create or replace function public.reports_payments_total(
  end_date timestamptz default null,
  start_date timestamptz default null
)
returns table (
  total numeric,
  used_range_fallback boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  has_created_at boolean;
begin
  select exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'payments'
      and c.column_name = 'created_at'
  ) into has_created_at;

  if start_date is not null and end_date is not null and has_created_at then
    return query
      select coalesce(sum(coalesce(p.amount, 0)), 0)::numeric as total,
             false as used_range_fallback
      from public.payments p
      where p.created_at >= start_date
        and p.created_at < end_date;
  elsif start_date is not null and end_date is not null and not has_created_at then
    return query
      select coalesce(sum(coalesce(p.amount, 0)), 0)::numeric as total,
             true as used_range_fallback
      from public.payments p;
  else
    return query
      select coalesce(sum(coalesce(p.amount, 0)), 0)::numeric as total,
             false as used_range_fallback
      from public.payments p;
  end if;
end;
$$;

grant execute on function public.reports_appointment_metrics(timestamptz, timestamptz) to authenticated;
grant execute on function public.reports_top_services(timestamptz, integer, timestamptz) to authenticated;
grant execute on function public.reports_payments_total(timestamptz, timestamptz) to authenticated;
