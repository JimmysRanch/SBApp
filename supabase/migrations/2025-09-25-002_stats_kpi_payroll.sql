-- begin migration 002
begin;
create table if not exists staff_stats_daily(
  staff_id uuid not null references profiles(id) on delete cascade,
  day date not null,
  service_id uuid,
  jobs int default 0,
  gross_revenue numeric default 0,
  service_minutes int default 0,
  primary key (staff_id, day, service_id)
);

create or replace function refresh_staff_stats(_from date, _to date)
returns void language sql as $$
with ap as (
  select a.staff_id,
         date_trunc('day',a.starts_at)::date as day,
         a.service_id,
         count(*) jobs,
         sum(coalesce(a.total_price,0)) gross_revenue,
         sum(extract(epoch from (a.ends_at-a.starts_at))/60)::int service_minutes
  from appointments a
  where a.starts_at::date between _from and _to
    and a.status in ('completed','paid')
  group by 1,2,3
)
insert into staff_stats_daily(staff_id,day,service_id,jobs,gross_revenue,service_minutes)
select * from ap
on conflict (staff_id,day,service_id) do update
set jobs=excluded.jobs,
    gross_revenue=excluded.gross_revenue,
    service_minutes=excluded.service_minutes;
$$;

create or replace function kpi_staff_window(_sid uuid, _from date, _to date)
returns table(jobs int, revenue numeric, minutes int)
language sql stable as $$
  select coalesce(sum(jobs),0),
         coalesce(sum(gross_revenue),0),
         coalesce(sum(service_minutes),0)
  from staff_stats_daily
  where staff_id=_sid and day between _from and _to;
$$;

create or replace function history_totals(_sid uuid, _from timestamptz, _to timestamptz, _status text)
returns table(cnt int, revenue numeric, tip numeric)
language sql stable as $$
  select count(*), coalesce(sum(total_price),0), coalesce(sum(tip),0)
  from appointments
  where staff_id=_sid
    and (_from is null or starts_at >= _from)
    and (_to is null or starts_at <= _to)
    and (_status is null or _status='all' or status=_status);
$$;

create table if not exists staff_comp(
  staff_id uuid primary key references profiles(id) on delete cascade,
  commission_rate numeric default 0,
  hourly_rate numeric default 0,
  salary_annual numeric default 0,
  weekly_guarantee numeric default 0,
  guarantee_mode text check (guarantee_mode in ('add','whichever_higher')) default 'whichever_higher',
  notes text
);
create table if not exists shifts(
  id bigserial primary key,
  staff_id uuid references profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text
);
create table if not exists time_off(
  id bigserial primary key,
  staff_id uuid references profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','denied'))
);
create table if not exists payroll_entries(
  id bigserial primary key,
  staff_id uuid references profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  amount numeric not null,
  type text not null,           -- 'bonus','deduction','override'
  meta jsonb default '{}'
);

create or replace function payroll_calc(_sid uuid, _from date, _to date)
returns jsonb language sql stable as $$
with comp as (
  select commission_rate, hourly_rate, salary_annual, weekly_guarantee, guarantee_mode
  from staff_comp where staff_id=_sid
),
base as (
  select coalesce(sum(a.total_price),0)::numeric gross
  from appointments a
  where a.staff_id=_sid and a.starts_at::date between _from and _to and a.status in ('completed','paid')
),
hours as (
  select coalesce(sum(extract(epoch from (ends_at - starts_at))/3600.0),0)::numeric hrs
  from shifts where staff_id=_sid and starts_at::date between _from and _to
),
adj as (
  select coalesce(sum(amount),0)::numeric adjustments
  from payroll_entries where staff_id=_sid and period_start=_from and period_end=_to
)
select jsonb_build_object(
  'gross', base.gross,
  'commission', base.gross * coalesce((select commission_rate from comp),0) / 100.0,
  'hourly', coalesce((select hourly_rate from comp),0) * (select hrs from hours),
  'adjustments', (select adjustments from adj)
) from base;
$$;

commit;
-- end migration 002
