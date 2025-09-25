create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'client' check (role in ('master','admin','manager','front_desk','groomer','bather','client')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy profiles_self on public.profiles
for select using (auth.uid() = id);

create policy profiles_admin_read on public.profiles
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('master','admin'))
);

create or replace function public.current_role() returns text
language sql stable as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.role_rank(r text) returns int
language sql immutable as $$
  select case lower(r)
    when 'master' then 7
    when 'admin' then 6
    when 'manager' then 5
    when 'front_desk' then 4
    when 'groomer' then 3
    when 'bather' then 2
    when 'client' then 1
    else 0 end
$$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users(id) on delete cascade,
  groomer_id uuid references auth.users(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text,
  created_at timestamptz default now()
);
alter table public.appointments enable row level security;

create policy appt_admin_all on public.appointments
for all using (public.current_role() in ('master','admin'))
with check (public.current_role() in ('master','admin'));

create policy appt_manager_read_all on public.appointments
for select using (public.current_role() = 'manager');

create policy appt_manager_insert on public.appointments
for insert with check (public.current_role() = 'manager');

create policy appt_manager_update_own on public.appointments
for update using (public.current_role() = 'manager' and auth.uid() = groomer_id);

create policy appt_recept_insert on public.appointments
for insert with check (public.current_role() = 'front_desk');

create policy appt_recept_read_all on public.appointments
for select using (public.current_role() = 'front_desk');

create policy appt_groomer_read_own on public.appointments
for select using (public.current_role() in ('groomer','bather') and auth.uid() = groomer_id);

create policy appt_client_read_own on public.appointments
for select using (public.current_role() = 'client' and auth.uid() = client_id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'client')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_appts_groomer on public.appointments(groomer_id);
create index if not exists idx_appts_client on public.appointments(client_id);

update public.profiles
set role = case role
  when 'Master Account' then 'master'
  when 'Admin' then 'admin'
  when 'Manager' then 'manager'
  when 'Front Desk' then 'front_desk'
  when 'Groomer' then 'groomer'
  when 'Bather' then 'bather'
  when 'Client' then 'client'
  else role end
where role in ('Master Account','Admin','Manager','Front Desk','Groomer','Bather','Client');

update public.employees
set role = case role
  when 'Master Account' then 'master'
  when 'Admin' then 'admin'
  when 'Manager' then 'manager'
  when 'Front Desk' then 'front_desk'
  when 'Groomer' then 'groomer'
  when 'Bather' then 'bather'
  when 'Client' then 'client'
  else role end
where role in ('Master Account','Admin','Manager','Front Desk','Groomer','Bather','Client');

-- BOOTSTRAP MASTER (makes you Master immediately)
-- by known UUID
insert into public.profiles (id, role)
values ('2dec66df-bb0c-4517-b0dd-bf0a8b1a3f9d','master')
on conflict (id) do update set role='master';

-- safety: if UUID ever changes, also promote by email
insert into public.profiles (id, role)
select u.id, 'master' from auth.users u
where lower(u.email) = lower('alexandersiskind@gmail.com')
on conflict (id) do update set role='master';
