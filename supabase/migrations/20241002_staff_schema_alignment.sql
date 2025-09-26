-- Align staff-facing schema with application expectations and refresh PostgREST cache

-- Ensure required extensions exist
create extension if not exists pgcrypto;

-- Role enum used by staff records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'role_t'
  ) THEN
    CREATE TYPE public.role_t AS ENUM (
      'owner',
      'admin',
      'manager',
      'groomer',
      'front_desk',
      'assistant'
    );
  END IF;
END;
$$;

-- Add/normalise employee profile columns
alter table public.employees
  add column if not exists status text,
  add column if not exists initials text,
  add column if not exists color_hex text,
  add column if not exists avatar_url text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists address_street text,
  add column if not exists address_city text,
  add column if not exists address_state text,
  add column if not exists address_zip text,
  add column if not exists bio text,
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default timezone('utc', now()),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- Ensure app_permissions/compensation_plan defaults exist
alter table public.employees
  add column if not exists app_permissions jsonb default '{}'::jsonb,
  add column if not exists compensation_plan jsonb default '{}'::jsonb;

alter table public.employees
  alter column app_permissions set default '{}'::jsonb,
  alter column compensation_plan set default '{}'::jsonb;

-- Ensure status is constrained to active/inactive and populated
update public.employees
set status = case
  when status is null then case when coalesce(active, true) then 'active' else 'inactive' end
  when lower(status) in ('active', 'inactive') then lower(status)
  when status ~* 'archived|terminated|disabled|inactive' then 'inactive'
  else 'active'
end
where status is distinct from case
  when status is null then case when coalesce(active, true) then 'active' else 'inactive' end
  when lower(status) in ('active', 'inactive') then lower(status)
  when status ~* 'archived|terminated|disabled|inactive' then 'inactive'
  else 'active'
end;

alter table public.employees
  drop constraint if exists employees_status_check;

alter table public.employees
  add constraint employees_status_check check (status in ('active','inactive'));

-- Ensure initials exist for calendar lanes
update public.employees
set initials = left(
  regexp_replace(coalesce(name, ''), '\s+', '', 'g'),
  greatest(length(regexp_replace(coalesce(name, ''), '\s+', '', 'g')), 2)
)
where (initials is null or length(trim(initials)) = 0)
  and coalesce(name, '') <> '';

-- Normalise colour metadata to hex strings when absent
update public.employees
set color_hex = coalesce(
  nullif(color_hex, ''),
  case trim(coalesce(calendar_color_class, color_class, ''))
    when 'bg-rose-500' then '#f43f5e'
    when 'bg-pink-500' then '#ec4899'
    when 'bg-purple-500' then '#a855f7'
    when 'bg-violet-500' then '#8b5cf6'
    when 'bg-indigo-500' then '#6366f1'
    when 'bg-blue-500' then '#3b82f6'
    when 'bg-sky-500' then '#0ea5e9'
    when 'bg-cyan-500' then '#06b6d4'
    when 'bg-teal-500' then '#14b8a6'
    when 'bg-emerald-500' then '#10b981'
    when 'bg-lime-500' then '#84cc16'
    when 'bg-yellow-400' then '#facc15'
    when 'bg-amber-500' then '#f59e0b'
    when 'bg-orange-500' then '#f97316'
    when 'bg-red-500' then '#ef4444'
    else '#6366f1'
  end
)
where color_hex is null or trim(color_hex) = '';

-- Ensure role column exists with constrained values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'employees'
      AND column_name = 'role'
  ) THEN
    ALTER TABLE public.employees ADD COLUMN role role_t;
  ELSE
    BEGIN
      ALTER TABLE public.employees
        ALTER COLUMN role TYPE role_t
        USING (
          case
            when role is null then null
            when lower(role::text) in ('owner', 'master', 'master account') then 'owner'::role_t
            when lower(role::text) in ('admin', 'administrator') then 'admin'::role_t
            when lower(role::text) in ('manager', 'senior groomer', 'senior_groomer') then 'manager'::role_t
            when lower(role::text) in ('front desk', 'front_desk', 'receptionist') then 'front_desk'::role_t
            when lower(role::text) like 'groomer%' then 'groomer'::role_t
            else 'assistant'::role_t
          end
        );
    EXCEPTION
      WHEN undefined_column THEN
        ALTER TABLE public.employees ADD COLUMN role role_t;
    END;
  END IF;
END;
$$;

update public.employees
set role = coalesce(
  role,
  case
    when lower(coalesce(role::text, '')) in ('owner', 'master', 'master account') then 'owner'::role_t
    when lower(coalesce(role::text, '')) in ('admin', 'administrator') then 'admin'::role_t
    when lower(coalesce(role::text, '')) in ('manager', 'senior groomer', 'senior_groomer') then 'manager'::role_t
    when lower(coalesce(role::text, '')) in ('front desk', 'front_desk', 'receptionist') then 'front_desk'::role_t
    when lower(coalesce(role::text, '')) like 'groomer%' then 'groomer'::role_t
    else 'assistant'::role_t
  end
)
where role is null;

alter table public.employees
  alter column role set not null,
  alter column role set default 'groomer';

-- Email uniqueness enforcement
create unique index if not exists employees_email_unique on public.employees (lower(email)) where email is not null;

-- Updated_at trigger reuse
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_employees_updated on public.employees;
create trigger trg_employees_updated
before update on public.employees
for each row execute procedure public.set_updated_at();

-- Calendar view exposing normalised staff data
create or replace view public.v_staff_calendar as
select
  e.id,
  coalesce(nullif(trim(e.name), ''), concat('Staff #', e.id)) as full_name,
  coalesce(nullif(trim(e.initials), ''), upper(left(regexp_replace(coalesce(e.name, ''), '\s+', '', 'g'), 2))) as initials,
  e.avatar_url,
  e.color_hex,
  e.role,
  e.status
from public.employees e
where e.status = 'active';

grant select on public.v_staff_calendar to authenticated;

grant usage on schema public to authenticated;

-- Staff permissions table (RLS enforced)
create table if not exists public.staff_permissions (
  staff_id bigint not null references public.employees(id) on delete cascade,
  perm_key text not null,
  allowed boolean not null default false,
  inserted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (staff_id, perm_key)
);

create trigger trg_staff_permissions_updated
before update on public.staff_permissions
for each row execute procedure public.set_updated_at();

alter table public.staff_permissions enable row level security;

create policy if not exists staff_permissions_read on public.staff_permissions
  for select
  using (auth.role() = 'authenticated');

create policy if not exists staff_permissions_manage on public.staff_permissions
  for all
  using (coalesce((auth.jwt() ->> 'is_manager')::boolean, false))
  with check (coalesce((auth.jwt() ->> 'is_manager')::boolean, false));

-- Compensation plans
create table if not exists public.comp_plans (
  staff_id bigint primary key references public.employees(id) on delete cascade,
  commission_enabled boolean not null default false,
  commission_pct numeric,
  hourly_enabled boolean not null default false,
  hourly_rate numeric,
  salary_enabled boolean not null default false,
  salary_annual numeric,
  weekly_guarantee_enabled boolean not null default false,
  weekly_guarantee numeric,
  guarantee_payout_rule text not null default 'whichever_higher' check (guarantee_payout_rule in ('pay_both','whichever_higher')),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_comp_plans_updated on public.comp_plans;
create trigger trg_comp_plans_updated
before update on public.comp_plans
for each row execute procedure public.set_updated_at();

alter table public.comp_plans enable row level security;

create policy if not exists comp_plans_read on public.comp_plans
  for select
  using (auth.role() = 'authenticated');

create policy if not exists comp_plans_manage on public.comp_plans
  for all
  using (coalesce((auth.jwt() ->> 'is_manager')::boolean, false))
  with check (coalesce((auth.jwt() ->> 'is_manager')::boolean, false));

-- Staff availability
create table if not exists public.staff_availability (
  id uuid primary key default gen_random_uuid(),
  staff_id bigint not null references public.employees(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  effective_from date not null,
  effective_to date
);

alter table public.staff_availability enable row level security;

create policy if not exists staff_availability_read on public.staff_availability
  for select
  using (auth.role() = 'authenticated');

create policy if not exists staff_availability_manage on public.staff_availability
  for all
  using (coalesce((auth.jwt() ->> 'is_manager')::boolean, false))
  with check (coalesce((auth.jwt() ->> 'is_manager')::boolean, false));

-- Staff services
create table if not exists public.staff_services (
  staff_id bigint not null references public.employees(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  price_override numeric,
  duration_override int,
  primary key (staff_id, service_id)
);

alter table public.staff_services enable row level security;

create policy if not exists staff_services_read on public.staff_services
  for select
  using (auth.role() = 'authenticated');

create policy if not exists staff_services_manage on public.staff_services
  for all
  using (coalesce((auth.jwt() ->> 'is_manager')::boolean, false))
  with check (coalesce((auth.jwt() ->> 'is_manager')::boolean, false));

-- Team overrides
create table if not exists public.team_overrides (
  id uuid primary key default gen_random_uuid(),
  manager_id bigint not null references public.employees(id) on delete cascade,
  member_id bigint not null references public.employees(id) on delete cascade,
  override_pct numeric not null check (override_pct >= 0 and override_pct <= 100)
);

alter table public.team_overrides enable row level security;

create policy if not exists team_overrides_read on public.team_overrides
  for select
  using (auth.role() = 'authenticated');

create policy if not exists team_overrides_manage on public.team_overrides
  for all
  using (coalesce((auth.jwt() ->> 'is_manager')::boolean, false))
  with check (coalesce((auth.jwt() ->> 'is_manager')::boolean, false));

-- Appointment events history
create table if not exists public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  event_type text not null,
  old jsonb,
  new jsonb,
  actor_id bigint references public.employees(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.appointment_events enable row level security;

create policy if not exists appointment_events_read on public.appointment_events
  for select
  using (auth.role() = 'authenticated');

create policy if not exists appointment_events_manage on public.appointment_events
  for all
  using (coalesce((auth.jwt() ->> 'is_manager')::boolean, false))
  with check (coalesce((auth.jwt() ->> 'is_manager')::boolean, false));

-- Grant select on new tables to authenticated users
grant select on table public.staff_permissions to authenticated;
grant select on table public.comp_plans to authenticated;
grant select on table public.staff_availability to authenticated;
grant select on table public.staff_services to authenticated;
grant select on table public.team_overrides to authenticated;
grant select on table public.appointment_events to authenticated;

-- Ensure PostgREST picks up the schema changes immediately
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION
  WHEN undefined_function THEN NULL;
END;
$$;
