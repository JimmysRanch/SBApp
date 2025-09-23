create table if not exists public.payroll_settings (
  id bigint primary key generated always as identity,
  frequency text not null default 'biweekly', -- weekly|biweekly|semimonthly|monthly
  payday text not null default 'Friday',      -- Monday..Sunday
  period_start text not null default 'Monday',-- Monday|Sunday
  updated_at timestamptz not null default now()
);
alter table public.payroll_settings enable row level security;
create policy payroll_settings_rw on public.payroll_settings
for all using (true) with check (true);
-- Seed one row if empty
insert into public.payroll_settings (frequency, payday, period_start)
select 'biweekly','Friday','Monday'
where not exists (select 1 from public.payroll_settings);
