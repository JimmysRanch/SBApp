-- Ensure employee schema matches application expectations for staff profile features

alter table public.employees
  add column if not exists status text,
  add column if not exists initials text,
  add column if not exists color_class text,
  add column if not exists calendar_color_class text,
  add column if not exists avatar_url text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists address_street text,
  add column if not exists address_city text,
  add column if not exists address_state text,
  add column if not exists address_zip text,
  add column if not exists bio text,
  add column if not exists app_permissions jsonb default '{}'::jsonb,
  add column if not exists compensation_plan jsonb default '{}'::jsonb,
  add column if not exists preferred_breeds text[] default '{}',
  add column if not exists not_accepted_breeds text[] default '{}',
  add column if not exists specialties text[] default '{}',
  add column if not exists manager_notes text;

alter table public.employees
  alter column app_permissions set default '{}'::jsonb,
  alter column preferred_breeds set default '{}',
  alter column not_accepted_breeds set default '{}',
  alter column specialties set default '{}',
  alter column compensation_plan set default '{}'::jsonb,
  alter column status set default 'active';

-- Normalise status values to lowercase keywords
update public.employees
set status = case
  when status is null and coalesce(active, false) then 'active'
  when status is null and not coalesce(active, false) then 'inactive'
  when lower(status) in ('active', 'inactive') then lower(status)
  else null
end
where status is distinct from case
  when status is null and coalesce(active, false) then 'active'
  when status is null and not coalesce(active, false) then 'inactive'
  when lower(status) in ('active', 'inactive') then lower(status)
  else null
end;

-- Enforce allowed status values if the column exists
alter table public.employees
  drop constraint if exists employees_status_check;

alter table public.employees
  add constraint employees_status_check check (status is null or status in ('active','inactive'));

-- Ensure goals table exists for staff preferences panel
create table if not exists public.staff_goals (
  staff_id bigint primary key references public.employees(id) on delete cascade,
  weekly_revenue_target numeric,
  desired_dogs_per_day int,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.staff_goals enable row level security;

create policy if not exists "staff_goals_read" on public.staff_goals
  for select
  using (
    auth.role() = 'authenticated'
    and (
      coalesce((auth.jwt() ->> 'is_manager')::boolean, false)
      or staff_id::text = coalesce(auth.jwt() ->> 'employee_id', '0')
    )
  );

create policy if not exists "staff_goals_manage" on public.staff_goals
  for all
  using (coalesce((auth.jwt() ->> 'is_manager')::boolean, false))
  with check (coalesce((auth.jwt() ->> 'is_manager')::boolean, false));

