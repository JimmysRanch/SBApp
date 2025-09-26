create or replace view public.v_staff_calendar as
select
  e.id,
  e.name,
  e.name as full_name,
  e.initials,
  e.avatar_url,
  e.calendar_color_class,
  e.color_class,
  coalesce(nullif(trim(e.calendar_color_class), ''), nullif(trim(e.color_class), '')) as color_hex,
  e.role,
  e.bio,
  e.status,
  e.active,
  e.app_permissions
from public.employees e
where coalesce(lower(e.status), case when coalesce(e.active, false) then 'active' else 'inactive' end) = 'active';
