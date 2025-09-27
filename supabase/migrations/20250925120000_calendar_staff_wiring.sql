-- (Renamed from 2025-09-25-001_calendar_staff_wiring.sql; original content unchanged)
-- begin migration 001
begin;
create extension if not exists pgcrypto;

-- Roles + one-master flag
create table if not exists roles(
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  permissions jsonb not null default '[]'::jsonb
);
alter table profiles
  add column if not exists role_id uuid references roles(id),
  add column if not exists is_master boolean not null default false;
create unique index if not exists ux_one_master on profiles ((true)) where is_master;

insert into roles(name,permissions) values
('Admin','["manage_roles","manage_staff","manage_hours","manage_calendar","manage_clients","manage_payroll","view_reports"]'),
('Manager','["manage_hours","manage_calendar","manage_clients","view_reports"]'),
('Groomer','["view_calendar","edit_own_appts"]'),
('Bather','["view_calendar","edit_own_appts"]'),
('Front Desk','["manage_calendar","manage_clients"]'),
('Client','["request_booking","view_own_records"]')
on conflict(name) do nothing;

-- legacy text role → role_id
update profiles p
set role_id = r.id
from roles r
where p.role_id is null
  and lower(replace(coalesce(p.role::text,''),'_',' ')) = lower(r.name);

-- Hours tables
create table if not exists shop_hours(
  id bigserial primary key,
  dow int not null check(dow between 0 and 6),
  opens time not null, closes time not null,
  unique(dow)
);
create table if not exists shop_hour_exceptions(
  id bigserial primary key,
  on_date date not null unique,
  opens time, closes time
);
create table if not exists staff_availability(
  id bigserial primary key,
  staff_id uuid not null references profiles(id) on delete cascade,
  dow int not null check(dow between 0 and 6),
  start_time time not null, end_time time not null,
  unique(staff_id,dow,start_time,end_time)
);
insert into shop_hours(dow,opens,closes) values
(1,'08:00','18:00'),(2,'08:00','18:00'),(3,'08:00','18:00'),(4,'08:00','18:00'),(5,'08:00','18:00')
on conflict(dow) do nothing;

-- Ghost staff backfill
with missing as (
  select distinct a.staff_id
  from appointments a
  left join profiles p on p.id=a.staff_id
  where a.staff_id is not null and p.id is null
)
insert into profiles(id, full_name)
select m.staff_id, concat('Imported Staff ', right(m.staff_id::text,12))
from missing m
on conflict(id) do nothing;

-- Enforce FK
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='public' and table_name='appointments' and constraint_name='fk_appointments_staff'
  ) then
    alter table appointments
      add constraint fk_appointments_staff
      foreign key (staff_id) references profiles(id)
      on update cascade on delete set null;
  end if;
end$$;

-- Bookability
create or replace function can_book(_staff uuid, _starts timestamptz, _ends timestamptz)
returns boolean language sql stable as $$
with z as (
  select _starts s, _ends e,
         (_starts at time zone 'UTC')::date d,
         extract(dow from _starts)::int dow,
         (_starts::time) st, (_ends::time) et
),
shop_ok as (
  select 1 from z
  join shop_hours h on h.dow=z.dow
  left join shop_hour_exceptions ex on ex.on_date=z.d
  where coalesce(ex.opens,h.opens) <= z.st
    and coalesce(ex.closes,h.closes) >= z.et
),
staff_ok as (
  select 1 from z
  join staff_availability a on a.staff_id=_staff and a.dow=z.dow
  where a.start_time <= z.st and a.end_time >= z.et
),
no_overlap as (
  select 1 where not exists (
    select 1 from appointments ap
    where ap.staff_id=_staff
      and tsrange(ap.starts_at,ap.ends_at,'[)') && tsrange(_starts,_ends,'[)')
  )
)
select exists(select 1 from shop_ok)
   and exists(select 1 from staff_ok)
   and exists(select 1 from no_overlap);
$$;

create or replace function enforce_booking()
returns trigger language plpgsql as $$
begin
  if new.staff_id is null then raise exception 'Missing staff_id'; end if;
  if new.starts_at is null or new.ends_at is null or new.ends_at <= new.starts_at then
    raise exception 'Invalid time range';
  end if;
  if not can_book(new.staff_id,new.starts_at,new.ends_at) then
    raise exception 'Slot not bookable: outside hours, staff unavailable, or overlapping';
  end if;
  return new;
end$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname='trg_enforce_booking' and tgrelid='appointments'::regclass) then
    create trigger trg_enforce_booking
    before insert or update on appointments
    for each row execute function enforce_booking();
  end if;
end$$;

create or replace function has_perm(_uid uuid, _perm text)
returns boolean language sql stable as $$
  select true
  from profiles p
  left join roles r on r.id=p.role_id
  where p.id=_uid and (p.is_master=true or (r.permissions ? _perm))
  limit 1;
$$;

alter table profiles enable row level security;
drop policy if exists profiles_ro on profiles;
create policy profiles_ro on profiles
for select using (auth.uid()=id or has_perm(auth.uid(),'manage_staff'));
drop policy if exists profiles_rw on profiles;
create policy profiles_rw on profiles
for update using (has_perm(auth.uid(),'manage_staff') or exists(select 1 from profiles where id=auth.uid() and is_master))
with check (has_perm(auth.uid(),'manage_staff') or exists(select 1 from profiles where id=auth.uid() and is_master));

alter table shop_hours enable row level security;
drop policy if exists hours_rw on shop_hours;
create policy hours_rw on shop_hours for all using (has_perm(auth.uid(),'manage_hours')) with check (has_perm(auth.uid(),'manage_hours'));

alter table shop_hour_exceptions enable row level security;
drop policy if exists hours_ex_rw on shop_hour_exceptions;
create policy hours_ex_rw on shop_hour_exceptions for all using (has_perm(auth.uid(),'manage_hours')) with check (has_perm(auth.uid(),'manage_hours'));

alter table staff_availability enable row level security;
drop policy if exists sav_rw on staff_availability;
create policy sav_rw on staff_availability for all using (has_perm(auth.uid(),'manage_hours') or staff_id=auth.uid())
with check (has_perm(auth.uid(),'manage_hours') or staff_id=auth.uid());

alter table appointments enable row level security;
drop policy if exists appt_rw on appointments;
create policy appt_rw on appointments
for all using (
  has_perm(auth.uid(),'manage_calendar')
  or (has_perm(auth.uid(),'edit_own_appts') and staff_id=auth.uid())
)
with check (
  has_perm(auth.uid(),'manage_calendar')
  or (has_perm(auth.uid(),'edit_own_appts') and staff_id=auth.uid())
);

commit;
-- end migration 001
