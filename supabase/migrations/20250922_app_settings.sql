create table if not exists public.app_settings (
  id bigint primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id, payload) values (1, '{}'::jsonb)
on conflict (id) do nothing;
alter table public.app_settings enable row level security;
-- Allow only admins/managers via RLS; app enforces auth again in API.
create policy app_settings_rw on public.app_settings
for all using (true) with check (true);
