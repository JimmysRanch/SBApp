create table if not exists public.staff_goals (
  staff_id uuid references public.employees(id) on delete cascade,
  weekly_revenue_target numeric,
  desired_dogs_per_day int,
  primary key (staff_id)
);

alter table public.staff_goals enable row level security;

create policy if not exists "Staff goals - owner select" on public.staff_goals
  for select
  using (
    exists (
      select 1 from public.employees e
      where e.id = staff_goals.staff_id
        and e.user_id = auth.uid()
    )
  );

create policy if not exists "Staff goals - manager access" on public.staff_goals
  for all
  using (coalesce(auth.jwt() ->> 'role', '') = 'manager')
  with check (coalesce(auth.jwt() ->> 'role', '') = 'manager');
