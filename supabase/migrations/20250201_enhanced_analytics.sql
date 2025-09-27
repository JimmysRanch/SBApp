-- Enhanced analytics functions with business_id scoping and pagination support
BEGIN;

-- Enhanced appointment metrics with business_id scoping and status filtering
create or replace function public.reports_appointment_metrics_enhanced(
  business_id uuid default null,
  end_date timestamptz default null,
  staff_id uuid default null,
  start_date timestamptz default null,
  status_filter text default null
)
returns table (
  total_appointments bigint,
  completed bigint,
  canceled bigint,
  no_show bigint,  
  pending bigint,
  revenue numeric,
  expected_revenue numeric,
  avg_appointment_value numeric
)
language sql
security definer
set search_path = public
as $$
  with filtered as (
    select a.*
    from public.appointments a
    left join public.employees e on a.staff_id = e.id
    where (start_date is null or a.start_time >= start_date)
      and (end_date is null or a.start_time < end_date)
      and (business_id is null or e.business_id = business_id)
      and (staff_id is null or a.staff_id = staff_id)
      and (status_filter is null or status_filter = 'all' or a.status ilike status_filter)
  )
  select
    count(*)::bigint as total_appointments,
    count(*) filter (where a.status ilike 'completed')::bigint as completed,
    count(*) filter (where a.status ilike 'cancel%')::bigint as canceled,
    count(*) filter (where a.status ilike 'no%show%')::bigint as no_show,
    count(*) filter (where a.status not ilike 'completed' and a.status not ilike 'cancel%' and a.status not ilike 'no%show%')::bigint as pending,
    coalesce(sum(case when a.status ilike 'completed' then coalesce(a.price, 0)::numeric else 0 end), 0)::numeric as revenue,
    coalesce(sum(coalesce(a.price, 0)::numeric), 0)::numeric as expected_revenue,
    case 
      when count(*) filter (where a.status ilike 'completed') > 0 
      then coalesce(sum(case when a.status ilike 'completed' then coalesce(a.price, 0)::numeric else 0 end), 0) / count(*) filter (where a.status ilike 'completed')
      else 0 
    end::numeric as avg_appointment_value
  from filtered a;
$$;

-- Paginated staff performance metrics with business scoping
create or replace function public.reports_staff_performance(
  business_id uuid default null,
  end_date timestamptz default null,
  limit_count integer default 10,
  offset_count integer default 0,
  start_date timestamptz default null
)
returns table (
  staff_id uuid,
  staff_name text,
  total_appointments bigint,
  completed_appointments bigint,
  completion_rate numeric,
  total_revenue numeric,
  avg_revenue_per_appointment numeric
)
language sql
security definer
set search_path = public
as $$
  with staff_metrics as (
    select 
      e.id as staff_id,
      e.name as staff_name,
      count(a.id)::bigint as total_appointments,
      count(a.id) filter (where a.status ilike 'completed')::bigint as completed_appointments,
      case 
        when count(a.id) > 0 
        then (count(a.id) filter (where a.status ilike 'completed'))::numeric / count(a.id)::numeric * 100
        else 0 
      end as completion_rate,
      coalesce(sum(case when a.status ilike 'completed' then coalesce(a.price, 0) else 0 end), 0)::numeric as total_revenue,
      case 
        when count(a.id) filter (where a.status ilike 'completed') > 0 
        then coalesce(sum(case when a.status ilike 'completed' then coalesce(a.price, 0) else 0 end), 0) / count(a.id) filter (where a.status ilike 'completed')
        else 0 
      end::numeric as avg_revenue_per_appointment
    from public.employees e
    left join public.appointments a on e.id = a.staff_id
      and (start_date is null or a.start_time >= start_date)
      and (end_date is null or a.start_time < end_date)
    where (business_id is null or e.business_id = business_id)
    group by e.id, e.name
  )
  select *
  from staff_metrics
  order by total_revenue desc, completion_rate desc
  limit greatest(coalesce(limit_count, 10), 0)
  offset greatest(coalesce(offset_count, 0), 0);
$$;

-- Business analytics summary
create or replace function public.reports_business_summary(
  business_id uuid default null,
  end_date timestamptz default null,
  start_date timestamptz default null
)
returns table (
  total_staff bigint,
  active_staff bigint,
  total_appointments bigint,
  completed_appointments bigint,
  total_revenue numeric,
  avg_appointment_value numeric,
  completion_rate numeric
)
language sql
security definer
set search_path = public
as $$
  select
    count(distinct e.id)::bigint as total_staff,
    count(distinct e.id) filter (where e.active = true)::bigint as active_staff,
    count(a.id)::bigint as total_appointments,
    count(a.id) filter (where a.status ilike 'completed')::bigint as completed_appointments,
    coalesce(sum(case when a.status ilike 'completed' then coalesce(a.price, 0) else 0 end), 0)::numeric as total_revenue,
    case 
      when count(a.id) filter (where a.status ilike 'completed') > 0 
      then coalesce(sum(case when a.status ilike 'completed' then coalesce(a.price, 0) else 0 end), 0) / count(a.id) filter (where a.status ilike 'completed')
      else 0 
    end::numeric as avg_appointment_value,
    case 
      when count(a.id) > 0 
      then (count(a.id) filter (where a.status ilike 'completed'))::numeric / count(a.id)::numeric * 100
      else 0 
    end::numeric as completion_rate
  from public.employees e
  left join public.appointments a on e.id = a.staff_id
    and (start_date is null or a.start_time >= start_date)
    and (end_date is null or a.start_time < end_date)
  where (business_id is null or e.business_id = business_id);
$$;

COMMIT;