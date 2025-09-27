-- Incremental migration: add staff_events (if missing), RLS, and read RPCs.
-- Amended (Option B): Never grant anon; only authenticated receives execute.

create table if not exists app.staff_events(
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references app.staff(id) on delete cascade,
  event_type text not null,
  old jsonb,
  new jsonb,
  actor_profile_id uuid references app.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table app.staff_events enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='app' and tablename='staff_events' and policyname='read_auth'
  ) then
    create policy read_auth on app.staff_events for select
      using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='app' and tablename='staff_events' and policyname='write_admins'
  ) then
    create policy write_admins on app.staff_events for all
      using (
        app.has_permission(app.current_profile_id(),'manage_app')
        or app.has_permission(app.current_profile_id(),'manage_staff')
      )
      with check (
        app.has_permission(app.current_profile_id(),'manage_app')
        or app.has_permission(app.current_profile_id(),'manage_staff')
      );
  end if;
end $$;

-- Read RPC: staff calendar
drop function if exists app.get_staff_calendar();
create function app.get_staff_calendar()
returns jsonb
language sql
stable
security definer
set search_path=app as $$
  select coalesce(jsonb_agg(to_jsonb(v)),'[]'::jsonb)
  from app.v_staff_calendar v;
$$;
grant execute on function app.get_staff_calendar() to authenticated;

-- Read RPC: single staff composite
drop function if exists app.get_staff(uuid);
create function app.get_staff(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=app as $$
declare rec jsonb;
begin
  select jsonb_build_object(
    'staff', to_jsonb(s),
    'permissions', coalesce((
      select jsonb_agg(jsonb_build_object('perm_key',sp.perm_key,'allowed',sp.allowed))
      from app.staff_permissions sp where sp.staff_id = s.id
    ), '[]'::jsonb),
    'comp_plan', (select to_jsonb(cp) from app.comp_plans cp where cp.staff_id=s.id),
    'services', coalesce((
      select jsonb_agg(to_jsonb(ss)) from app.staff_services ss where ss.staff_id=s.id
    ), '[]'::jsonb),
    'availability', coalesce((
      select jsonb_agg(to_jsonb(a)) from app.staff_availability a where a.staff_id=s.id
    ), '[]'::jsonb)
  ) into rec
  from app.staff s
  where s.id = p_id;
  return coalesce(rec,'{}'::jsonb);
end;
$$;
grant execute on function app.get_staff(uuid) to authenticated;

-- Read RPC: client + pets
drop function if exists app.get_client_with_pets(uuid);
create function app.get_client_with_pets(p_client uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=app as $$
declare rec jsonb;
begin
  select jsonb_build_object(
    'client', to_jsonb(c),
    'pets', coalesce((
      select jsonb_agg(to_jsonb(p)) from app.pets p where p.client_id=c.id
    ), '[]'::jsonb)
  ) into rec
  from app.clients c where c.id=p_client;
  return coalesce(rec,'{}'::jsonb);
end;
$$;
grant execute on function app.get_client_with_pets(uuid) to authenticated;

-- Read RPC: recent messages
drop function if exists app.list_recent_messages(int);
create function app.list_recent_messages(p_limit int default 50)
returns jsonb
language sql
stable
security definer
set search_path=app as $$
  select coalesce(jsonb_agg(row_to_json(t)),'[]'::jsonb)
  from (
    select m.id, m.thread_id, m.client_id, m.staff_id, m.direction, m.channel,
           m.body, m.status, m.created_at
    from app.messages m
    order by m.created_at desc
    limit greatest(1, least(coalesce(p_limit,50),200))
  ) t;
$$;
grant execute on function app.list_recent_messages(int) to authenticated;

-- Read RPC: appointment detail
drop function if exists app.get_appointment(uuid);
create function app.get_appointment(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=app as $$
declare rec jsonb;
begin
  select jsonb_build_object(
    'appointment', to_jsonb(a),
    'items', coalesce((
      select jsonb_agg(to_jsonb(i)) from app.appointment_items i where i.appointment_id=a.id
    ), '[]'::jsonb),
    'events', coalesce((
      select jsonb_agg(to_jsonb(e) order by e.created_at asc)
      from app.appointment_events e where e.appointment_id=a.id
    ), '[]'::jsonb)
  ) into rec
  from app.appointments a
  where a.id=p_id;
  return coalesce(rec,'{}'::jsonb);
end;
$$;
grant execute on function app.get_appointment(uuid) to authenticated;

-- Read RPC: list appointments for range (optional staff filter)
drop function if exists app.list_appointments_for_range(uuid, timestamptz, timestamptz);
create function app.list_appointments_for_range(p_staff uuid, p_start timestamptz, p_end timestamptz)
returns jsonb
language sql
stable
security definer
set search_path=app as $$
  select coalesce(jsonb_agg(row_to_json(t)),'[]'::jsonb) from (
    select a.*
    from app.appointments a
    where a.start_at >= p_start
      and a.end_at <= p_end
      and (p_staff is null or a.staff_id = p_staff)
    order by a.start_at
  ) t;
$$;
grant execute on function app.list_appointments_for_range(uuid, timestamptz, timestamptz) to authenticated;

-- NOTICE
do $$ BEGIN RAISE NOTICE 'Read RPCs created; execution restricted to authenticated only (Option B).'; END $$;