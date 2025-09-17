create table if not exists public.appointment_discounts (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references public.appointments(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  reason text not null,
  created_by uuid references public.employees(id),
  created_at timestamptz default now()
);

alter table public.appointment_discounts enable row level security;

create policy if not exists "Appointment discounts - read" on public.appointment_discounts
  for select
  using (
    coalesce(auth.jwt() ->> 'role', '') = 'manager'
    or exists (
      select 1 from public.appointments a
        join public.employees e on e.id = a.staff_id
      where a.id = appointment_discounts.appointment_id
        and e.user_id = auth.uid()
    )
  );

create policy if not exists "Appointment discounts - manager write" on public.appointment_discounts
  for all
  using (coalesce(auth.jwt() ->> 'role', '') = 'manager')
  with check (coalesce(auth.jwt() ->> 'role', '') = 'manager');
