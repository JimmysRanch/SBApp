create or replace view public.payroll_lines_view as
with scoped_appointments as (
  select a.*
  from public.appointments a
  where
    coalesce(auth.jwt() ->> 'role', '') in ('manager', 'admin', 'service_role')
    or exists (
      select 1
      from public.employees e
      where e.id = a.staff_id
        and e.user_id = auth.uid()
    )
)
select
  a.id,
  a.staff_id,
  a.starts_at,
  a.ends_at,
  a.pet_name,
  a.service_name,
  a.price as base_price,
  coalesce(a.commission_rate, 0) as commission_rate,
  round(a.price * coalesce(a.commission_rate, 0) / 100.0, 2) as commission_amount,
  coalesce(d.amount, 0) as adjustment_amount,
  d.reason as adjustment_reason,
  round((a.price * coalesce(a.commission_rate, 0) / 100.0) - coalesce(d.amount, 0), 2) as final_earnings,
  extract(week from a.starts_at)::int - extract(week from date_trunc('month', a.starts_at))::int + 1 as week_index
from scoped_appointments a
left join lateral (
  select
    coalesce(sum(amount), 0) as amount,
    nullif(string_agg(reason, '; '), '') as reason
  from public.appointment_discounts d
  where d.appointment_id = a.id
) d on true;
