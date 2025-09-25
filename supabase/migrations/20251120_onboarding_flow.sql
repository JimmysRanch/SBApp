-- Onboarding flow: businesses, staff invites, default services, and scoped RLS

create extension if not exists pgcrypto;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  logo_url text,
  timezone text not null default 'UTC',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_businesses_created_by on public.businesses(created_by);
create unique index if not exists idx_businesses_owner_unique on public.businesses(created_by) where created_by is not null;

drop trigger if exists trg_businesses_updated on public.businesses;
create trigger trg_businesses_updated
  before update on public.businesses
  for each row execute function public.set_updated_at();

alter table public.profiles
  add column if not exists business_id uuid references public.businesses(id) on delete set null,
  add column if not exists invited_by uuid references public.profiles(id) on delete set null,
  add column if not exists raw_metadata jsonb not null default '{}'::jsonb;

update public.profiles p
set role = lower(role)
where role <> lower(role);

update public.profiles
set role = 'manager'
where role in ('admin', 'senior_groomer');

update public.profiles
set role = 'front_desk'
where role = 'receptionist';

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (
    role in ('master','manager','front_desk','groomer','client')
  );

alter table public.profiles alter column role set default 'client';

create index if not exists idx_profiles_business on public.profiles(business_id);
create index if not exists idx_profiles_invited_by on public.profiles(invited_by);

create unique index if not exists idx_profiles_master_unique
  on public.profiles(business_id)
  where role = 'master';

drop function if exists public.current_role();
create or replace function public.current_role()
returns text
language sql
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop function if exists public.role_rank(text);
create or replace function public.role_rank(r text)
returns integer
language sql
immutable
as $$
  select case lower(coalesce(r, ''))
    when 'master' then 5
    when 'manager' then 4
    when 'front_desk' then 3
    when 'groomer' then 2
    when 'client' then 1
    else 0
  end;
$$;

create or replace function public.current_business_id()
returns uuid
language sql
stable
set search_path = public
as $$
  select business_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_manager_role()
returns boolean
language sql
stable
set search_path = public
as $$
  select public.role_rank(public.current_role()) >= 4;
$$;

create or replace function public.normalise_role(role_input text)
returns text
language sql
immutable
as $$
  with cleaned as (
    select lower(trim(coalesce(role_input, ''))) as role_value
  )
  select case role_value
    when 'master account' then 'master'
    when 'owner' then 'master'
    when 'master' then 'master'
    when 'manager' then 'manager'
    when 'admin' then 'manager'
    when 'senior_groomer' then 'manager'
    when 'senior groomer' then 'manager'
    when 'front_desk' then 'front_desk'
    when 'front desk' then 'front_desk'
    when 'receptionist' then 'front_desk'
    when 'groomer' then 'groomer'
    when 'client' then 'client'
    else 'client'
  end
  from cleaned;
$$;

create table if not exists public.staff_invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  email text not null,
  role text not null check (public.normalise_role(role) in ('manager','front_desk','groomer')),
  token text not null unique,
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_staff_invitations_business on public.staff_invitations(business_id);
create index if not exists idx_staff_invitations_email on public.staff_invitations(lower(email));
create unique index if not exists idx_staff_invites_email_pending
  on public.staff_invitations(business_id, lower(email))
  where accepted_at is null;

alter table public.staff_invitations enable row level security;

drop function if exists public.has_role_ci(text[]);
create or replace function public.has_role_ci(role_names text[])
returns boolean
language sql
stable
set search_path = public
as $$
  with desired as (
    select public.normalise_role(role_name) as role_name
    from unnest(role_names) as role_name
  )
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and public.normalise_role(p.role) in (select role_name from desired)
  );
$$;

create or replace function public.ensure_business_name(raw jsonb, fallback_email text)
returns text
language plpgsql
immutable
as $$
declare
  candidate text;
begin
  candidate := nullif(trim(coalesce(raw->>'business_name', raw->>'company')), '');
  if candidate is not null then
    return candidate;
  end if;
  candidate := nullif(trim(coalesce(raw->>'full_name', raw->>'name')), '');
  if candidate is not null then
    return candidate || ' Business';
  end if;
  if fallback_email is not null then
    return split_part(fallback_email, '@', 1) || ' Grooming';
  end if;
  return 'New Grooming Business';
end;
$$;

drop function if exists public.handle_new_user();
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  invite record;
  assigned_business uuid;
  assigned_role text;
  invite_role text;
  raw_business text;
  parsed_business uuid;
  display_name text;
begin
  select *
    into invite
    from public.staff_invitations
   where lower(email) = lower(coalesce(new.email, ''))
     and accepted_at is null
     and (expires_at is null or expires_at > timezone('utc'::text, now()))
   order by created_at asc
   limit 1
   for update;

  if invite is not null then
    assigned_business := invite.business_id;
    invite_role := public.normalise_role(invite.role);
    assigned_role := invite_role;
    update public.staff_invitations
       set accepted_at = timezone('utc'::text, now()),
           accepted_by = new.id
     where id = invite.id;
  else
    raw_business := nullif(trim(metadata->>'business_id'), '');
    begin
      if raw_business is not null then
        parsed_business := raw_business::uuid;
      end if;
    exception
      when others then
        parsed_business := null;
    end;
    assigned_business := parsed_business;
    assigned_role := public.normalise_role(metadata->>'role');

    if assigned_business is null then
      if assigned_role = 'client' then
        raise exception 'Client signup requires business_id metadata';
      end if;

      assigned_role := 'master';
      insert into public.businesses (name, logo_url, timezone, created_by)
        values (
          public.ensure_business_name(metadata, new.email),
          nullif(trim(metadata->>'logo_url'), ''),
          coalesce(nullif(trim(metadata->>'timezone'), ''), 'UTC'),
          new.id
        )
        returning id into assigned_business;
    end if;
  end if;

  assigned_role := public.normalise_role(assigned_role);
  if assigned_role is null then
    assigned_role := 'client';
  end if;

  display_name := coalesce(
    nullif(trim(metadata->>'full_name'), ''),
    nullif(trim(metadata->>'name'), ''),
    new.email
  );

  insert into public.profiles (id, full_name, role, business_id, invited_by, raw_metadata)
    values (
      new.id,
      display_name,
      assigned_role,
      assigned_business,
      invite.invited_by,
      metadata
    )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    business_id = excluded.business_id,
    invited_by = excluded.invited_by,
    raw_metadata = excluded.raw_metadata;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  base_price numeric(10,2) not null default 0,
  duration_min integer not null default 60,
  buffer_pre_min integer not null default 0,
  buffer_post_min integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists idx_services_business_name
  on public.services(business_id, lower(name));
create index if not exists idx_services_business on public.services(business_id);

drop trigger if exists trg_services_updated on public.services;
create trigger trg_services_updated
  before update on public.services
  for each row execute function public.set_updated_at();

create table if not exists public.add_ons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null default 0,
  duration_min integer not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists idx_addons_business_name
  on public.add_ons(business_id, lower(name));
create index if not exists idx_addons_business on public.add_ons(business_id);

drop trigger if exists trg_addons_updated on public.add_ons;
create trigger trg_addons_updated
  before update on public.add_ons
  for each row execute function public.set_updated_at();

alter table public.businesses enable row level security;
alter table public.services enable row level security;
alter table public.add_ons enable row level security;

create policy businesses_self_access on public.businesses
  for select
  using (id = public.current_business_id());

create policy businesses_owner_update on public.businesses
  for update
  using (id = public.current_business_id() and public.current_role() = 'master')
  with check (id = public.current_business_id() and public.current_role() = 'master');

create policy businesses_insert_self on public.businesses
  for insert
  with check (created_by = auth.uid());

create policy services_same_business on public.services
  for select
  using (business_id = public.current_business_id());

create policy services_manage_owner on public.services
  for all
  using (business_id = public.current_business_id() and public.is_manager_role())
  with check (business_id = public.current_business_id() and public.is_manager_role());

create policy addons_same_business on public.add_ons
  for select
  using (business_id = public.current_business_id());

create policy addons_manage_owner on public.add_ons
  for all
  using (business_id = public.current_business_id() and public.is_manager_role())
  with check (business_id = public.current_business_id() and public.is_manager_role());

create policy staff_invites_same_business on public.staff_invitations
  for select
  using (business_id = public.current_business_id());

create policy staff_invites_manage on public.staff_invitations
  for all
  using (business_id = public.current_business_id() and public.current_role() = 'master')
  with check (business_id = public.current_business_id() and public.current_role() = 'master');

create or replace function public.assign_business_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.business_id is null then
    new.business_id := public.current_business_id();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_services_business on public.services;
create trigger trg_services_business
  before insert on public.services
  for each row execute function public.assign_business_id();

drop trigger if exists trg_addons_business on public.add_ons;
create trigger trg_addons_business
  before insert on public.add_ons
  for each row execute function public.assign_business_id();

drop trigger if exists trg_appointments_business on public.appointments;
create trigger trg_appointments_business
  before insert on public.appointments
  for each row execute function public.assign_business_id();

drop trigger if exists trg_pets_business on public.pets;
create trigger trg_pets_business
  before insert on public.pets
  for each row execute function public.assign_business_id();

drop trigger if exists trg_pet_photos_business on public.pet_photos;
create trigger trg_pet_photos_business
  before insert on public.pet_photos
  for each row execute function public.assign_business_id();

drop trigger if exists trg_availability_business on public.availability_rules;
create trigger trg_availability_business
  before insert on public.availability_rules
  for each row execute function public.assign_business_id();

drop trigger if exists trg_blackout_business on public.blackout_dates;
create trigger trg_blackout_business
  before insert on public.blackout_dates
  for each row execute function public.assign_business_id();

drop trigger if exists trg_appt_addons_business on public.appointment_add_ons;
create trigger trg_appt_addons_business
  before insert on public.appointment_add_ons
  for each row execute function public.assign_business_id();

drop trigger if exists trg_payments_business on public.payments;
create trigger trg_payments_business
  before insert on public.payments
  for each row execute function public.assign_business_id();

drop trigger if exists trg_audit_business on public.audit_log;
create trigger trg_audit_business
  before insert on public.audit_log
  for each row execute function public.assign_business_id();

drop trigger if exists trg_notification_business on public.notification_tokens;
create trigger trg_notification_business
  before insert on public.notification_tokens
  for each row execute function public.assign_business_id();

drop trigger if exists trg_reschedule_business on public.reschedule_links;
create trigger trg_reschedule_business
  before insert on public.reschedule_links
  for each row execute function public.assign_business_id();

alter table public.appointments
  add column if not exists business_id uuid references public.businesses(id) on delete set null;

update public.appointments a
set business_id = coalesce(
    (select s.business_id from public.services s where s.id = a.service_id),
    (select p.business_id from public.profiles p where p.id = a.staff_id),
    (select p2.business_id from public.profiles p2 where p2.id = a.client_id)
  )
where business_id is null;

create index if not exists idx_appointments_business on public.appointments(business_id);

alter table public.pets
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

update public.pets p
set business_id = (select pr.business_id from public.profiles pr where pr.id = p.client_id)
where business_id is null;

create index if not exists idx_pets_business on public.pets(business_id);

alter table public.pet_photos
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

update public.pet_photos ph
set business_id = (select pt.business_id from public.pets pt where pt.id = ph.pet_id)
where business_id is null;

create index if not exists idx_pet_photos_business on public.pet_photos(business_id);

alter table public.availability_rules
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

update public.availability_rules ar
set business_id = (select pr.business_id from public.profiles pr where pr.id = ar.staff_id)
where business_id is null;

create index if not exists idx_availability_business on public.availability_rules(business_id);

alter table public.blackout_dates
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

update public.blackout_dates bl
set business_id = (select pr.business_id from public.profiles pr where pr.id = bl.staff_id)
where business_id is null;

create index if not exists idx_blackout_business on public.blackout_dates(business_id);

alter table public.appointment_add_ons
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

update public.appointment_add_ons aa
set business_id = (select ap.business_id from public.appointments ap where ap.id = aa.appointment_id)
where business_id is null;

create index if not exists idx_appt_addons_business on public.appointment_add_ons(business_id);

alter table public.payments
  add column if not exists business_id uuid references public.businesses(id) on delete set null;

update public.payments pay
set business_id = (select ap.business_id from public.appointments ap where ap.id = pay.appointment_id)
where business_id is null;

create index if not exists idx_payments_business on public.payments(business_id);

alter table public.audit_log
  add column if not exists business_id uuid references public.businesses(id) on delete set null;

update public.audit_log au
set business_id = coalesce(
    (select pr.business_id from public.profiles pr where pr.id = au.actor_id),
    (select ap.business_id from public.appointments ap where ap.id = au.entity_id)
  )
where business_id is null;

create index if not exists idx_audit_log_business on public.audit_log(business_id);

alter table public.notification_tokens
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

update public.notification_tokens nt
set business_id = (select pr.business_id from public.profiles pr where pr.id = nt.user_id)
where business_id is null;

create index if not exists idx_notification_tokens_business on public.notification_tokens(business_id);

alter table public.reschedule_links
  add column if not exists business_id uuid references public.businesses(id) on delete cascade;

update public.reschedule_links rl
set business_id = (select ap.business_id from public.appointments ap where ap.id = rl.appointment_id)
where business_id is null;

create index if not exists idx_reschedule_links_business on public.reschedule_links(business_id);

drop policy if exists appointments_management_all on public.appointments;
drop policy if exists appointments_front_desk_select on public.appointments;
drop policy if exists appointments_front_desk_insert on public.appointments;
drop policy if exists appointments_front_desk_update on public.appointments;
drop policy if exists appointments_groomer_select on public.appointments;
drop policy if exists appointments_groomer_update on public.appointments;
drop policy if exists appointments_client_select on public.appointments;

create policy appointments_management_all on public.appointments
for all
using (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Manager','Admin','Master Account','manager','admin','master'])
)
with check (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Manager','Admin','Master Account','manager','admin','master'])
);

create policy appointments_front_desk_select on public.appointments
for select
using (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Front Desk','receptionist'])
);

create policy appointments_front_desk_insert on public.appointments
for insert
with check (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Front Desk','receptionist'])
);

create policy appointments_front_desk_update on public.appointments
for update
using (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Front Desk','receptionist'])
)
with check (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Front Desk','receptionist'])
);

create policy appointments_groomer_select on public.appointments
for select
using (
  business_id = public.current_business_id()
  and auth.uid() = staff_id
  and public.has_role_ci(ARRAY['Groomer','Senior Groomer','groomer','senior_groomer'])
);

create policy appointments_groomer_update on public.appointments
for update
using (
  business_id = public.current_business_id()
  and auth.uid() = staff_id
  and public.has_role_ci(ARRAY['Groomer','Senior Groomer','groomer','senior_groomer'])
)
with check (
  business_id = public.current_business_id()
  and auth.uid() = staff_id
  and public.has_role_ci(ARRAY['Groomer','Senior Groomer','groomer','senior_groomer'])
);

create policy appointments_client_select on public.appointments
for select
using (
  business_id = public.current_business_id()
  and auth.uid() = client_id
  and public.has_role_ci(ARRAY['Client','client'])
);

drop policy if exists pets_management_all on public.pets;
drop policy if exists pets_client_select on public.pets;

create policy pets_management_all on public.pets
for all
using (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Manager','Admin','Master Account','manager','admin','master'])
)
with check (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Manager','Admin','Master Account','manager','admin','master'])
);

create policy pets_client_select on public.pets
for select
using (
  business_id = public.current_business_id()
  and auth.uid() = client_id
  and public.has_role_ci(ARRAY['Client','client'])
);

drop policy if exists pet_photos_management_all on public.pet_photos;
drop policy if exists pet_photos_client_select on public.pet_photos;
drop policy if exists pet_photos_groomer_insert on public.pet_photos;

create policy pet_photos_management_all on public.pet_photos
for all
using (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Manager','Admin','Master Account','manager','admin','master'])
)
with check (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Manager','Admin','Master Account','manager','admin','master'])
);

create policy pet_photos_client_select on public.pet_photos
for select
using (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Client','client'])
  and exists (
    select 1 from public.pets p
    where p.id = pet_id
      and p.client_id = auth.uid()
  )
);

create policy pet_photos_groomer_insert on public.pet_photos
for insert
with check (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Groomer','Senior Groomer','groomer','senior_groomer'])
  and exists (
    select 1
    from public.appointments a
    where a.pet_id = pet_id
      and a.staff_id = auth.uid()
  )
);

drop policy if exists availability_rules_management_all on public.availability_rules;
drop policy if exists availability_rules_staff_select on public.availability_rules;

create policy availability_rules_management_all on public.availability_rules
for all
using (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Manager','Admin','Master Account','manager','admin','master'])
)
with check (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Manager','Admin','Master Account','manager','admin','master'])
);

create policy availability_rules_staff_select on public.availability_rules
for select
using (
  business_id = public.current_business_id()
  and staff_id = auth.uid()
);

drop policy if exists blackout_dates_management_all on public.blackout_dates;
drop policy if exists blackout_dates_staff_select on public.blackout_dates;

create policy blackout_dates_management_all on public.blackout_dates
for all
using (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Manager','Admin','Master Account','manager','admin','master'])
)
with check (
  business_id = public.current_business_id()
  and public.has_role_ci(ARRAY['Manager','Admin','Master Account','manager','admin','master'])
);

create policy blackout_dates_staff_select on public.blackout_dates
for select
using (
  business_id = public.current_business_id()
  and staff_id = auth.uid()
);

create or replace function public.seed_default_catalog(business uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.services (business_id, name, description, base_price, duration_min)
  values
    (business, 'Bath & Brush', 'Gentle wash and brush out', 45, 60),
    (business, 'Full Groom', 'Complete groom including styling', 75, 90),
    (business, 'Puppy Intro Groom', 'Short session for puppies', 55, 45)
  on conflict (business_id, lower(name)) do nothing;

  insert into public.add_ons (business_id, name, description, price, duration_min)
  values
    (business, 'Nail Trim', 'Clip and file nails', 15, 10),
    (business, 'Teeth Brushing', 'Freshen up with brushing', 12, 10),
    (business, 'De-shed Treatment', 'Reduces shedding with special shampoo', 25, 20),
    (business, 'Ear Cleaning', 'Gentle ear cleaning service', 10, 5)
  on conflict (business_id, lower(name)) do nothing;
end;
$$;

drop function if exists public.handle_business_created cascade;
create or replace function public.handle_business_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_catalog(new.id);
  return new;
end;
$$;

drop trigger if exists trg_businesses_seed on public.businesses;
create trigger trg_businesses_seed
  after insert on public.businesses
  for each row execute function public.handle_business_created();
