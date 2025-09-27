BEGIN;

-- Add nullable business_id columns (no constraints yet) and backfill with single business id.
alter table app.staff               add column if not exists business_id uuid; 
alter table app.clients             add column if not exists business_id uuid; 
alter table app.pets                add column if not exists business_id uuid; 
alter table app.services            add column if not exists business_id uuid; 
alter table app.add_ons             add column if not exists business_id uuid; 
alter table app.appointments        add column if not exists business_id uuid; 
alter table app.appointment_items   add column if not exists business_id uuid; 
alter table app.messages            add column if not exists business_id uuid; 
alter table app.message_threads     add column if not exists business_id uuid;

update app.staff             set business_id = (select id from app.business limit 1) where business_id is null;
update app.clients           set business_id = (select id from app.business limit 1) where business_id is null;
update app.pets              set business_id = (select id from app.business limit 1) where business_id is null;
update app.services          set business_id = (select id from app.business limit 1) where business_id is null;
update app.add_ons           set business_id = (select id from app.business limit 1) where business_id is null;
update app.appointments      set business_id = (select id from app.business limit 1) where business_id is null;
update app.appointment_items set business_id = (select id from app.business limit 1) where business_id is null;
update app.messages          set business_id = (select id from app.business limit 1) where business_id is null;
update app.message_threads   set business_id = (select id from app.business limit 1) where business_id is null;

-- list_staff RPC (paginated, searchable)
drop function if exists app.list_staff(text,int,int);
create or replace function app.list_staff(
  p_search text default null,
  p_limit int default 50,
  p_offset int default 0
) returns jsonb
language sql stable security definer
set search_path=app as $$
  with bounds as (
    select greatest(1, least(coalesce(p_limit,50),200)) as lim,
           greatest(coalesce(p_offset,0),0) as off
  ), base as (
    select s.id, s.display_name, s.email, s.phone, s.status, s.created_at
    from app.staff s
    where s.status='active'
      and (
        p_search is null or length(trim(p_search))=0 or (
          s.display_name ilike '%'||p_search||'%' or
          s.email ilike '%'||p_search||'%' or
          s.phone ilike '%'||p_search||'%'
        )
      )
  ), total as (select count(*)::int c from base), page as (
    select b.* from base b, bounds bo order by b.display_name limit bo.lim offset bo.off
  )
  select jsonb_build_object(
    'data', coalesce(jsonb_agg(to_jsonb(page)),'[]'::jsonb),
    'total', (select c from total),
    'limit', (select lim from bounds),
    'offset',(select off from bounds),
    'next_offset', (
      select case when (select off from bounds)+(select lim from bounds) >= (select c from total) then null
                  else (select off from bounds)+(select lim from bounds) end
    )
  ) from page;
$$;

-- list_clients RPC
drop function if exists app.list_clients(text,int,int);
create or replace function app.list_clients(
  p_search text default null,
  p_limit int default 50,
  p_offset int default 0
) returns jsonb
language sql stable security definer
set search_path=app as $$
  with bounds as (
    select greatest(1, least(coalesce(p_limit,50),200)) as lim,
           greatest(coalesce(p_offset,0),0) as off
  ), base as (
    select c.id, c.display_name, c.email, c.phone, c.created_at
    from app.clients c
    where (
      p_search is null or length(trim(p_search))=0 or (
        c.display_name ilike '%'||p_search||'%' or
        c.email ilike '%'||p_search||'%' or
        c.phone ilike '%'||p_search||'%'
      )
    )
  ), total as (select count(*)::int c from base), page as (
    select b.* from base b, bounds bo order by b.display_name limit bo.lim offset bo.off
  )
  select jsonb_build_object(
    'data', coalesce(jsonb_agg(to_jsonb(page)),'[]'::jsonb),
    'total', (select c from total),
    'limit', (select lim from bounds),
    'offset',(select off from bounds),
    'next_offset', (
      select case when (select off from bounds)+(select lim from bounds) >= (select c from total) then null
                  else (select off from bounds)+(select lim from bounds) end
    )
  ) from page;
$$;

-- revenue_summary RPC
drop function if exists app.revenue_summary(timestamptz, timestamptz);
create or replace function app.revenue_summary(
  p_start timestamptz,
  p_end   timestamptz
) returns jsonb
language sql stable security definer
set search_path=app as $$
  with finished as (
    select a.id
    from app.appointments a
    where a.status='finished'
      and a.start_at between p_start and p_end
  ), rev as (
    select coalesce(sum(i.price),0)::numeric as total_revenue
    from app.appointment_items i
    join finished f on f.id = i.appointment_id
  ), cnt as (
    select count(*)::int as finished_appointments from finished
  )
  select jsonb_build_object(
    'total_revenue', (select total_revenue from rev),
    'finished_appointments', (select finished_appointments from cnt),
    'avg_ticket', case when (select finished_appointments from cnt) > 0
                       then (select total_revenue from rev)/(select finished_appointments from cnt)
                       else 0 end,
    'range', jsonb_build_object('start',p_start,'end',p_end)
  );
$$;

-- employee_workload RPC
drop function if exists app.employee_workload(timestamptz, timestamptz, uuid);
create or replace function app.employee_workload(
  p_start timestamptz,
  p_end   timestamptz,
  p_staff uuid default null
) returns jsonb
language sql stable security definer
set search_path=app as $$
  with roster as (
    select s.id, s.display_name
    from app.staff s
    where s.status='active' and (p_staff is null or s.id = p_staff)
  ), appts as (
    select a.staff_id, a.status
    from app.appointments a
    where a.start_at between p_start and p_end
      and (p_staff is null or a.staff_id = p_staff)
  ), agg as (
    select r.id as staff_id,
      coalesce(sum(case when ap.status='scheduled' then 1 else 0 end),0)::int as scheduled,
      coalesce(sum(case when ap.status='finished'  then 1 else 0 end),0)::int as finished,
      coalesce(sum(case when ap.status='canceled'  then 1 else 0 end),0)::int as canceled,
      coalesce(sum(case when ap.status='no_show'   then 1 else 0 end),0)::int as no_show
    from roster r
    left join appts ap on ap.staff_id = r.id
    group by r.id
  ), data as (
    select jsonb_agg(to_jsonb(agg) order by staff_id) as arr, count(*)::int as total_staff from agg
  )
  select jsonb_build_object(
    'data', coalesce((select arr from data),'[]'::jsonb),
    'total_staff', (select total_staff from data),
    'range', jsonb_build_object('start',p_start,'end',p_end)
  );
$$;

-- Grants (authenticated only)
revoke execute on function app.list_staff(text,int,int) from public, anon;
revoke execute on function app.list_clients(text,int,int) from public, anon;
revoke execute on function app.revenue_summary(timestamptz, timestamptz) from public, anon;
revoke execute on function app.employee_workload(timestamptz, timestamptz, uuid) from public, anon;

grant execute on function app.list_staff(text,int,int) to authenticated;
grant execute on function app.list_clients(text,int,int) to authenticated;
grant execute on function app.revenue_summary(timestamptz, timestamptz) to authenticated;
grant execute on function app.employee_workload(timestamptz, timestamptz, uuid) to authenticated;

COMMIT;

DO $$ BEGIN RAISE NOTICE 'Business ID columns added & backfilled; new analytics + listing RPCs created (Ref #327).'; END $$;

-- End migration