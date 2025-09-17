-- Calendar events table and indexes. Run via Supabase migration or SQL editor.
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('appointment','shift','timeOff')),
  start timestamptz not null,
  "end" timestamptz not null,
  notes text,
  staffId uuid,
  petId uuid,
  allDay boolean not null default false,
  createdAt timestamptz not null default now(),
  updatedAt timestamptz not null default now()
);
create index if not exists idx_calendar_events_timerange on public.calendar_events ("start","end");
create index if not exists idx_calendar_events_staff on public.calendar_events (staffId);
create index if not exists idx_calendar_events_type on public.calendar_events (type);
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new."updatedAt" = now(); return new; end $$;
drop trigger if exists trg_calendar_events_updated on public.calendar_events;
create trigger trg_calendar_events_updated before update on public.calendar_events
for each row execute function public.set_updated_at();

-- Example RLS (adjust to your auth model). Enable and allow service role.
alter table public.calendar_events enable row level security;
drop policy if exists "service role full access" on public.calendar_events;
create policy "service role full access" on public.calendar_events
  for all using (auth.jwt() ->> 'role' = 'service_role') with check (true);
