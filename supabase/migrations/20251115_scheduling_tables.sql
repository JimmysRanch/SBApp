-- Scheduling tables and RLS policies

-- drop legacy tables/policies if they exist
-- appointments-related dependencies
DROP POLICY IF EXISTS appt_admin_all ON public.appointments;
DROP POLICY IF EXISTS appt_senior_read_all ON public.appointments;
DROP POLICY IF EXISTS appt_senior_insert ON public.appointments;
DROP POLICY IF EXISTS appt_senior_update_own ON public.appointments;
DROP POLICY IF EXISTS appt_manager_read_all ON public.appointments;
DROP POLICY IF EXISTS appt_manager_insert ON public.appointments;
DROP POLICY IF EXISTS appt_manager_update_own ON public.appointments;
DROP POLICY IF EXISTS appt_recept_insert ON public.appointments;
DROP POLICY IF EXISTS appt_recept_read_all ON public.appointments;
DROP POLICY IF EXISTS appt_groomer_read_own ON public.appointments;
DROP POLICY IF EXISTS appt_client_read_own ON public.appointments;

DROP TABLE IF EXISTS public.appointment_add_ons;
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.audit_log;
DROP TABLE IF EXISTS public.notification_tokens;
DROP TABLE IF EXISTS public.reschedule_links;
DROP TABLE IF EXISTS public.pet_photos;
DROP TABLE IF EXISTS public.pets;
DROP TABLE IF EXISTS public.blackout_dates;
DROP TABLE IF EXISTS public.availability_rules;
DROP TABLE IF EXISTS public.appointments;
DROP VIEW IF EXISTS public.v_roles;

-- core entities
CREATE TABLE IF NOT EXISTS public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  breed text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pet_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE,
  url text NOT NULL,
  taken_at timestamptz,
  caption text,
  uploaded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.availability_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  rrule_text text NOT NULL,
  tz text NOT NULL,
  buffer_pre_min int DEFAULT 10,
  buffer_post_min int DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blackout_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  pet_id uuid REFERENCES public.pets(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  price_service numeric(10,2) NOT NULL,
  price_addons numeric(10,2) DEFAULT 0,
  discount numeric(10,2) DEFAULT 0,
  tax numeric(10,2) DEFAULT 0,
  status text CHECK (status IN ('booked','checked_in','in_progress','completed','canceled','no_show')),
  notes text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.appointment_add_ons (
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  add_on_id uuid REFERENCES public.add_ons(id) ON DELETE CASCADE,
  price numeric(10,2) NOT NULL,
  PRIMARY KEY (appointment_id, add_on_id)
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL,
  method text,
  status text,
  received_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  ts timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform text CHECK (platform IN ('web','ios','android')),
  token text NOT NULL,
  last_seen_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.reschedule_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  token text UNIQUE,
  expires_at timestamptz,
  used_at timestamptz
);

-- indexes to support lookups
CREATE INDEX IF NOT EXISTS idx_pets_client ON public.pets(client_id);
CREATE INDEX IF NOT EXISTS idx_pet_photos_pet ON public.pet_photos(pet_id);
CREATE INDEX IF NOT EXISTS idx_availability_staff ON public.availability_rules(staff_id);
CREATE INDEX IF NOT EXISTS idx_blackout_staff ON public.blackout_dates(staff_id);
CREATE INDEX IF NOT EXISTS idx_appts_staff ON public.appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_appts_client ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appts_pet ON public.appointments(pet_id);
CREATE INDEX IF NOT EXISTS idx_appt_addons_addon ON public.appointment_add_ons(add_on_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment ON public.payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user ON public.notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reschedule_links_token ON public.reschedule_links(token);

-- Row Level Security Policies
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- helper function for case-insensitive role checks
CREATE OR REPLACE FUNCTION public.has_role_ci(role_names text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  WITH desired AS (
    SELECT lower(role_name) AS role_name
    FROM unnest(role_names) AS role_name
  )
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(p.role) IN (SELECT role_name FROM desired)
  );
$$;

-- appointments policies
CREATE POLICY appointments_management_all ON public.appointments
FOR ALL
USING (
  public.has_role_ci(ARRAY['Master Account','Admin','Manager','master account','admin','manager','master'])
)
WITH CHECK (
  public.has_role_ci(ARRAY['Master Account','Admin','Manager','master account','admin','manager','master'])
);

CREATE POLICY appointments_front_desk_select ON public.appointments
FOR SELECT
USING (
  public.has_role_ci(ARRAY['Front Desk','receptionist','front desk'])
);

CREATE POLICY appointments_front_desk_insert ON public.appointments
FOR INSERT
WITH CHECK (
  public.has_role_ci(ARRAY['Front Desk','receptionist','front desk'])
);

CREATE POLICY appointments_front_desk_update ON public.appointments
FOR UPDATE
USING (
  public.has_role_ci(ARRAY['Front Desk','receptionist','front desk'])
)
WITH CHECK (
  public.has_role_ci(ARRAY['Front Desk','receptionist','front desk'])
);

CREATE POLICY appointments_groomer_select ON public.appointments
FOR SELECT
USING (
  auth.uid() = staff_id
  AND public.has_role_ci(ARRAY['Groomer','Bather','Senior Groomer','groomer','bather','senior_groomer'])
);

CREATE POLICY appointments_groomer_update ON public.appointments
FOR UPDATE
USING (
  auth.uid() = staff_id
  AND public.has_role_ci(ARRAY['Groomer','Bather','Senior Groomer','groomer','bather','senior_groomer'])
)
WITH CHECK (
  auth.uid() = staff_id
  AND public.has_role_ci(ARRAY['Groomer','Bather','Senior Groomer','groomer','bather','senior_groomer'])
);

CREATE POLICY appointments_client_select ON public.appointments
FOR SELECT
USING (
  auth.uid() = client_id
  AND public.has_role_ci(ARRAY['Client','client'])
);

-- pets policies
CREATE POLICY pets_management_all ON public.pets
FOR ALL
USING (
  public.has_role_ci(ARRAY['Master Account','Admin','Manager','master account','admin','manager','master'])
)
WITH CHECK (
  public.has_role_ci(ARRAY['Master Account','Admin','Manager','master account','admin','manager','master'])
);

CREATE POLICY pets_client_select ON public.pets
FOR SELECT
USING (
  auth.uid() = client_id
  AND public.has_role_ci(ARRAY['Client','client'])
);

-- pet_photos policies
CREATE POLICY pet_photos_management_all ON public.pet_photos
FOR ALL
USING (
  public.has_role_ci(ARRAY['Master Account','Admin','Manager','master account','admin','manager','master'])
)
WITH CHECK (
  public.has_role_ci(ARRAY['Master Account','Admin','Manager','master account','admin','manager','master'])
);

CREATE POLICY pet_photos_client_select ON public.pet_photos
FOR SELECT
USING (
  public.has_role_ci(ARRAY['Client','client'])
  AND EXISTS (
    SELECT 1 FROM public.pets p
    WHERE p.id = pet_id
      AND p.client_id = auth.uid()
  )
);

CREATE POLICY pet_photos_groomer_insert ON public.pet_photos
FOR INSERT
WITH CHECK (
  public.has_role_ci(ARRAY['Groomer','Bather','Senior Groomer','groomer','bather','senior_groomer'])
  AND EXISTS (
    SELECT 1
    FROM public.appointments a
    WHERE a.pet_id = pet_id
      AND a.staff_id = auth.uid()
  )
);

-- availability rules policies
CREATE POLICY availability_rules_management_all ON public.availability_rules
FOR ALL
USING (
  public.has_role_ci(ARRAY['Master Account','Admin','Manager','master account','admin','manager','master'])
)
WITH CHECK (
  public.has_role_ci(ARRAY['Master Account','Admin','Manager','master account','admin','manager','master'])
);

CREATE POLICY availability_rules_staff_select ON public.availability_rules
FOR SELECT
USING (
  staff_id = auth.uid()
);

-- blackout dates policies
CREATE POLICY blackout_dates_management_all ON public.blackout_dates
FOR ALL
USING (
  public.has_role_ci(ARRAY['Master Account','Admin','Manager','master account','admin','manager','master'])
)
WITH CHECK (
  public.has_role_ci(ARRAY['Master Account','Admin','Manager','master account','admin','manager','master'])
);

CREATE POLICY blackout_dates_staff_select ON public.blackout_dates
FOR SELECT
USING (
  staff_id = auth.uid()
);
