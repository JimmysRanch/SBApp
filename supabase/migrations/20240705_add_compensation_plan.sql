alter table public.employees
  add column if not exists compensation_plan jsonb default '{}'::jsonb;
