-- Create the app schema if it doesn't exist
create schema if not exists app;

-- Staff core table (business data, not in public)
create table if not exists app.staff (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  email text not null unique,
  phone text not null,
  status text not null,
  street text,
  city text,
  state text,
  postal_code text,
  emergency_contact_name text,
  emergency_contact_phone text,
  avatar_url text,
  initials text,
  color_hex text,
  bio text,
  notes text,
  profile_id uuid references app.profiles(id) on delete set null,
  active boolean default true,
  created_at timestamptz not null default timezone('utc',now()),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists app.staff_permissions (
  staff_id uuid references app.staff(id) on delete cascade,
  perm_key text not null,
  allowed boolean not null,
  primary key (staff_id, perm_key)
);

create table if not exists app.comp_plans (
  staff_id uuid primary key references app.staff(id) on delete cascade,
  commission_enabled boolean not null default false,
  commission_pct numeric,
  hourly_enabled boolean not null default false,
  hourly_rate numeric,
  salary_enabled boolean not null default false,
  salary_annual numeric,
  weekly_guarantee_enabled boolean not null default false,
  weekly_guarantee numeric,
  guarantee_rule text check (guarantee_rule in ('whichever_higher','pay_both')),
  updated_at timestamptz not null default timezone('utc',now())
);

create table if not exists app.team_overrides (
  manager_id uuid references app.staff(id) on delete cascade,
  member_id uuid references app.staff(id) on delete cascade,
  override_pct numeric not null check (override_pct >= 0 and override_pct <= 100),
  primary key (manager_id, member_id)
);

create table if not exists app.staff_availability (
  id bigserial primary key,
  staff_id uuid references app.staff(id) on delete cascade,
  dow int not null check (dow between 0 and 6),
  start_time time not null,
  end_time time not null,
  effective_from date,
  effective_to date,
  unique(staff_id, dow, start_time, end_time, coalesce(effective_from, '1970-01-01'), coalesce(effective_to, '9999-12-31'))
);

create table if not exists app.staff_services (
  staff_id uuid references app.staff(id) on delete cascade,
  service_id uuid not null,
  price_override numeric,
  duration_override int,
  primary key (staff_id, service_id)
);

-- Audit log for all staff changes
create table if not exists app.staff_events (
  id bigserial primary key,
  staff_id uuid not null references app.staff(id) on delete cascade,
  event_type text not null check (event_type in ('created','updated','status_changed')),
  old jsonb,
  new jsonb,
  actor_profile_id uuid not null references app.profiles(id),
  created_at timestamptz not null default timezone('utc',now())
);

-- Expose only the "app" schema in Supabase API (do this in Supabase UI: Database → API → Exposed Schemas → add "app")