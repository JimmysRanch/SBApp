-- Alter calendar_events.staffId to bigint and add optional FK to employees
alter table if exists public.calendar_events
  alter column "staffId" drop not null;

alter table if exists public.calendar_events
  alter column "staffId" type bigint using case
    when "staffId" is null then null
    when ("staffId"::text ~ '^[0-9]+$') then ("staffId"::text)::bigint
    else null
  end;

drop constraint if exists calendar_events_staffid_fkey;

alter table if exists public.calendar_events
  add constraint calendar_events_staffid_fkey
  foreign key ("staffId")
  references public.employees(id)
  on delete set null;
