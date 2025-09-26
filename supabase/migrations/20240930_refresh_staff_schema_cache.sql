-- Ensure Supabase REST schema cache recognises staff profile columns

alter table if exists public.employees
  add column if not exists status text,
  add column if not exists compensation_plan jsonb default '{}'::jsonb,
  add column if not exists app_permissions jsonb default '{}'::jsonb;

create table if not exists public.staff_goals (
  staff_id bigint primary key references public.employees(id) on delete cascade,
  weekly_revenue_target numeric,
  desired_dogs_per_day int,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table if exists public.staff_goals enable row level security;

-- Refresh the cached schema metadata so new columns/tables are available immediately
DO $$
BEGIN
  PERFORM supabase_functions.refresh_schema_cache();
EXCEPTION
  WHEN undefined_function THEN NULL;
END;
$$;

create policy if not exists "Staff goals read" on public.staff_goals
  for select
  using (
    auth.role() = 'authenticated'
    and (
      coalesce((auth.jwt() ->> 'is_manager')::boolean, false)
      or staff_id::text = coalesce(auth.jwt() ->> 'employee_id', '0')
    )
  );

create policy if not exists "Staff goals manage" on public.staff_goals
  for all
  using (coalesce((auth.jwt() ->> 'is_manager')::boolean, false))
  with check (coalesce((auth.jwt() ->> 'is_manager')::boolean, false));
