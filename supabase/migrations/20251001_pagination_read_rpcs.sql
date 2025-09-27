-- Adds pagination (limit/offset) and richer return object to:
--   app.list_recent_messages
--   app.list_appointments_for_range
-- Return shape: {
--   data: [...],
--   total: int,
--   limit: int,
--   offset: int,
--   next_offset: int|null
-- }
-- Limit capped at 200. Both remain SECURITY DEFINER, authenticated-only.

-- Replace list_recent_messages
drop function if exists app.list_recent_messages(int);
drop function if exists app.list_recent_messages(int,int);

create or replace function app.list_recent_messages(
  p_limit  int default 50,
  p_offset int default 0
) returns jsonb
language sql
stable
security definer
set search_path=app as $$
  with bounds as (
    select
      greatest(1, least(coalesce(p_limit,50), 200)) as lim,
      greatest(coalesce(p_offset,0),0) as off
  ),
  subset as (
    select m.id, m.thread_id, m.client_id, m.staff_id, m.direction, m.channel,
           m.body, m.status, m.created_at
    from app.messages m, bounds b
    order by m.created_at desc
    limit b.lim offset b.off
  ),
  total as (select count(*)::int as c from app.messages)
  select jsonb_build_object(
    'data', coalesce(jsonb_agg(to_jsonb(subset)),'[]'::jsonb),
    'total', (select c from total),
    'limit', (select lim from bounds),
    'offset', (select off from bounds),
    'next_offset', (
      select case
        when (select off from bounds) + (select lim from bounds) >= (select c from total)
          then null
        else (select off from bounds) + (select lim from bounds)
      end
    )
  )
  from subset;
$$;

revoke execute on function app.list_recent_messages(int,int) from public, anon;
grant execute on function app.list_recent_messages(int,int) to authenticated;

-- Replace list_appointments_for_range
drop function if exists app.list_appointments_for_range(uuid, timestamptz, timestamptz);
drop function if exists app.list_appointments_for_range(uuid, timestamptz, timestamptz, int, int);

create or replace function app.list_appointments_for_range(
  p_staff uuid,
  p_start timestamptz,
  p_end   timestamptz,
  p_limit int default 50,
  p_offset int default 0
) returns jsonb
language sql
stable
security definer
set search_path=app as $$
  with bounds as (
    select
      greatest(1, least(coalesce(p_limit,50), 200)) as lim,
      greatest(coalesce(p_offset,0),0) as off
  ),
  filtered as (
    select a.*
    from app.appointments a
    where a.start_at >= p_start
      and a.end_at   <= p_end
      and (p_staff is null or a.staff_id = p_staff)
  ),
  paged as (
    select f.*
    from filtered f, bounds b
    order by f.start_at
    limit b.lim offset b.off
  ),
  total as (
    select count(*)::int as c from filtered
  )
  select jsonb_build_object(
    'data', coalesce(jsonb_agg(to_jsonb(paged)),'[]'::jsonb),
    'total', (select c from total),
    'limit', (select lim from bounds),
    'offset', (select off from bounds),
    'next_offset', (
      select case
        when (select off from bounds) + (select lim from bounds) >= (select c from total)
          then null
        else (select off from bounds) + (select lim from bounds)
      end
    )
  )
  from paged;
$$;

revoke execute on function app.list_appointments_for_range(uuid, timestamptz, timestamptz, int, int) from public, anon;
grant execute on function app.list_appointments_for_range(uuid, timestamptz, timestamptz, int, int) to authenticated;

-- NOTICE
do $$
begin
  raise notice 'Pagination added to list_recent_messages and list_appointments_for_range.';
end $$;
