-- Core entity tables for scheduling & booking
create extension if not exists pgcrypto;

-- Staff enhancements
alter table if exists public.employees
  add column if not exists initials text,
  add column if not exists bio text,
  add column if not exists calendar_color_class text,
  add column if not exists profile_slug text;

-- Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Pets
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade,
  name text not null,
  breed text,
  birthdate date,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Services & configuration
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_min int not null default 60,
  base_price numeric(10,2) not null default 0,
  buffer_pre_min int not null default 0,
  buffer_post_min int not null default 0,
  color_class text,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_sizes (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  label text not null,
  multiplier numeric(6,3) not null default 1,
  sort_order int not null default 0
);

create table if not exists public.add_ons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_add_ons (
  service_id uuid not null references public.services(id) on delete cascade,
  add_on_id uuid not null references public.add_ons(id) on delete cascade,
  primary key (service_id, add_on_id)
);

-- Appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  employee_id bigint references public.employees(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  pet_id uuid references public.pets(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  service_size_id uuid references public.service_sizes(id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  price numeric(10,2),
  price_addons numeric(10,2) default 0,
  discount numeric(10,2) default 0,
  tax numeric(10,2) default 0,
  status text not null default 'booked' check (status in ('booked','checked_in','in_progress','completed','canceled','no_show')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.appointment_add_ons (
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  add_on_id uuid not null references public.add_ons(id) on delete cascade,
  price numeric(10,2) not null default 0,
  primary key (appointment_id, add_on_id)
);

-- Updated timestamp trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_clients_updated on public.clients;
create trigger trg_clients_updated
before update on public.clients
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_pets_updated on public.pets;
create trigger trg_pets_updated
before update on public.pets
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated
before update on public.services
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_appointments_updated on public.appointments;
create trigger trg_appointments_updated
before update on public.appointments
for each row execute procedure public.set_updated_at();

-- Helpful indexes
create index if not exists idx_pets_client on public.pets(client_id);
create index if not exists idx_service_sizes_service on public.service_sizes(service_id, sort_order);
create index if not exists idx_appointments_staff_time on public.appointments(employee_id, start_time);
create index if not exists idx_appointments_client_time on public.appointments(client_id, start_time);
create index if not exists idx_appointments_pet_time on public.appointments(pet_id, start_time);

-- Enable RLS & simple policies
alter table public.clients enable row level security;
alter table public.pets enable row level security;
alter table public.services enable row level security;
alter table public.service_sizes enable row level security;
alter table public.add_ons enable row level security;
alter table public.service_add_ons enable row level security;
alter table public.appointments enable row level security;
alter table public.appointment_add_ons enable row level security;

create policy if not exists clients_authenticated_read on public.clients
  for select
  using (auth.role() = 'authenticated');
create policy if not exists clients_authenticated_write on public.clients
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy if not exists pets_authenticated_read on public.pets
  for select
  using (auth.role() = 'authenticated');
create policy if not exists pets_authenticated_write on public.pets
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy if not exists services_authenticated_read on public.services
  for select
  using (auth.role() = 'authenticated');
create policy if not exists services_authenticated_write on public.services
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy if not exists service_sizes_authenticated_read on public.service_sizes
  for select
  using (auth.role() = 'authenticated');
create policy if not exists service_sizes_authenticated_write on public.service_sizes
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy if not exists add_ons_authenticated_read on public.add_ons
  for select
  using (auth.role() = 'authenticated');
create policy if not exists add_ons_authenticated_write on public.add_ons
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy if not exists service_add_ons_authenticated on public.service_add_ons
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy if not exists appointments_authenticated_read on public.appointments
  for select
  using (auth.role() = 'authenticated');
create policy if not exists appointments_authenticated_write on public.appointments
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy if not exists appointment_add_ons_authenticated on public.appointment_add_ons
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
