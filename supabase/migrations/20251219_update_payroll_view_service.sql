-- Align payroll view with normalized services table
create or replace view public.payroll_lines_view as
select
  a.id as appointment_id,
  a.employee_id as staff_id,
  a.start_time,
  a.end_time,
  svc.name as service,
  svc.name as service_name,
  coalesce(a.price, 0)::numeric as base_price,
  coalesce(e.commission_rate, 0)::numeric as commission_rate,
  coalesce(a.price, 0)::numeric * coalesce(e.commission_rate, 0)::numeric as commission_amount,
  -coalesce(d.total_discount, 0)::numeric as adjustment_amount,
  d.reasons as adjustment_reason,
  coalesce(a.price, 0)::numeric + coalesce(a.price, 0)::numeric * coalesce(e.commission_rate, 0)::numeric - coalesce(d.total_discount, 0)::numeric as final_earnings,
  case
    when coalesce(a.start_time, a.starts_at) is null then null
    else ((floor((extract(doy from coalesce(a.start_time, a.starts_at)) - 1) / 7)::int % 2) + 1)
  end as week_index
from public.appointments a
join public.employees e on e.id = a.employee_id
left join public.services svc on svc.id = a.service_id
left join lateral (
  select
    coalesce(sum(amount), 0) as total_discount,
    string_agg(reason, '; ' order by created_at) as reasons
  from public.appointment_discounts ad
  where ad.appointment_id = a.id
) d on true;
