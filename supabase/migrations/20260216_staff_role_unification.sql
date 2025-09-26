-- Ensure employees link to profiles for role management
begin;

alter table public.employees
  add column if not exists user_id uuid references public.profiles(id) on delete set null;

create unique index if not exists employees_user_id_unique
  on public.employees(user_id)
  where user_id is not null;

with mapped as (
  select
    e.user_id,
    case
      when e.role is null or length(trim(e.role)) = 0 then null
      when lower(e.role) in ('master account', 'master') then 'master'
      when lower(e.role) in ('owner') then 'master'
      when lower(e.role) in ('admin', 'administrator') then 'admin'
      when lower(e.role) in ('manager', 'senior groomer', 'senior_groomer') then 'senior_groomer'
      when lower(e.role) in ('front desk', 'front_desk', 'receptionist') then 'receptionist'
      when lower(e.role) like 'groomer%' then 'groomer'
      else null
    end as resolved_role
  from public.employees e
  where e.user_id is not null
)
update public.profiles p
set role = mapped.resolved_role
from mapped
where mapped.user_id = p.id
  and mapped.resolved_role is not null
  and mapped.resolved_role <> p.role;

alter table public.employees
  drop column if exists role;

commit;
