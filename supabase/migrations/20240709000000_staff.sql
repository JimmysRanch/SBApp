-- Staff schema and helpers

-- Ensure employees has required columns
alter table public.employees
  add column if not exists role text,
  add column if not exists address_street text,
  add column if not exists address_city text,
  add column if not exists address_state text,
  add column if not exists address_zip text,
  add column if not exists avatar_url text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists pay_type text,
  add column if not exists commission_rate numeric,
  add column if not exists hourly_rate numeric,
  add column if not exists salary_rate numeric,
  add column if not exists allowed_services text[],
  add column if not exists app_permissions jsonb,
  add column if not exists preferred_breeds text[],
  add column if not exists not_accepted_breeds text[],
  add column if not exists specialties text[],
  add column if not exists manager_notes text;

-- Staff goals
create table if not exists public.staff_goals (
  staff_id bigint primary key references public.employees(id) on delete cascade,
  weekly_revenue_target numeric,
  desired_dogs_per_day int
);

-- Appointment discounts
create table if not exists public.appointment_discounts (
  id bigserial primary key,
  appointment_id bigint not null references public.appointments(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  reason text not null,
  created_by bigint references public.employees(id),
  created_at timestamptz default now()
);

-- Staff scheduling
create table if not exists public.staff_shifts (
  id bigserial primary key,
  employee_id bigint not null references public.employees(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text,
  created_at timestamptz default now()
);

create table if not exists public.staff_time_off (
  id bigserial primary key,
  employee_id bigint not null references public.employees(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  status text default 'pending'
);

drop view if exists public.payroll_lines_view;
create view public.payroll_lines_view as
select
  a.id as appointment_id,
  a.employee_id as staff_id,
  a.start_time,
  a.end_time,
  a.pet_id,
  a.client_id,
  a.service,
  a.price as base_price,
  coalesce(e.commission_rate, 0) as commission_rate,
  round(a.price * coalesce(e.commission_rate, 0) / 100.0, 2) as commission_amount,
  coalesce(d.amount, 0) as adjustment_amount,
  d.reason as adjustment_reason,
  round((a.price * coalesce(e.commission_rate, 0) / 100.0) - coalesce(d.amount, 0), 2) as final_earnings,
  extract(week from a.start_time)::int as week_index
from public.appointments a
join public.employees e on e.id = a.employee_id
left join lateral (
  select coalesce(sum(amount), 0) as amount,
         nullif(string_agg(reason, '; '), '') as reason
  from public.appointment_discounts d
  where d.appointment_id = a.id
) d on true;

-- Metrics RPCs
create or replace function public.staff_today_metrics(p_staff_id bigint)
returns table(dogs int, hours numeric)
language sql
stable
as $$
  select
    count(*)::int as dogs,
    coalesce(sum(extract(epoch from (a.end_time - a.start_time)) / 3600.0), 0) as hours
  from public.appointments a
  where a.employee_id = p_staff_id
    and a.start_time::date = now()::date;
$$;

create or replace function public.staff_week_metrics(p_staff_id bigint)
returns table(dogs int, revenue numeric, commission numeric, hours numeric)
language sql
stable
as $$
  with wk as (
    select *
    from public.payroll_lines_view v
    where v.staff_id = p_staff_id
      and date_trunc('week', v.start_time) = date_trunc('week', now())
  )
  select
    (
      select count(*)
      from public.appointments a
      where a.employee_id = p_staff_id
        and date_trunc('week', a.start_time) = date_trunc('week', now())
    ) as dogs,
    coalesce(sum(wk.base_price), 0) as revenue,
    coalesce(sum(wk.final_earnings), 0) as commission,
    coalesce(
      sum(
        extract(
          epoch from (
            select sum(a.end_time - a.start_time)
            from public.appointments a
            where a.employee_id = p_staff_id
              and date_trunc('week', a.start_time) = date_trunc('week', now())
          )
        ) / 3600.0
      ),
      0
    ) as hours
  from wk;
$$;

create or replace function public.staff_lifetime_metrics(p_staff_id bigint)
returns table(dogs int, revenue numeric)
language sql
stable
as $$
  select
    (
      select count(*)
      from public.appointments a
      where a.employee_id = p_staff_id
    ) as dogs,
    coalesce(
      (
        select sum(a.price)
        from public.appointments a
        where a.employee_id = p_staff_id
      ),
      0
    ) as revenue;
$$;

-- Row level security policies
alter table public.employees enable row level security;
alter table public.staff_goals enable row level security;
alter table public.appointment_discounts enable row level security;
alter table public.staff_shifts enable row level security;
alter table public.staff_time_off enable row level security;

create policy employees_read_all on public.employees
  for select to authenticated
  using (true);

create policy goals_rw_self on public.staff_goals
  for all to authenticated
  using (auth.uid() is not null);

create policy disc_read_all on public.appointment_discounts
  for select to authenticated
  using (true);

create policy disc_write_managers on public.appointment_discounts
  for insert to authenticated
  using (true)
  with check (true);

create policy shifts_rw on public.staff_shifts
  for all to authenticated
  using (true);

create policy timeoff_rw on public.staff_time_off
  for all to authenticated
  using (true);
