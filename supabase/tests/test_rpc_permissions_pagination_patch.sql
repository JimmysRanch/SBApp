-- Sanity test pagination semantics after new migration.
-- Run AFTER 20251001_pagination_read_rpcs.sql.

do $$
declare page1 jsonb; page2 jsonb; begin
  perform set_config('role','authenticated', true);
  select app.list_recent_messages(5,0) into page1;
  select app.list_recent_messages(5, coalesce((page1->>'next_offset')::int,0)) into page2;
  raise notice 'Messages page1 count=% next_offset=%', jsonb_array_length(page1->'data'), page1->>'next_offset';
  raise notice 'Messages page2 count=%', jsonb_array_length(page2->'data');
  select app.list_appointments_for_range(null, now() - interval '1 day', now() + interval '1 day', 10, 0) into page1;
  raise notice 'Appointments page1 total=% limit=% offset=% next_offset=%', page1->>'total', page1->>'limit', page1->>'offset', page1->>'next_offset';
end $$;