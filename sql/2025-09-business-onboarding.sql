BEGIN;

-- 1. Business
CREATE TABLE IF NOT EXISTS public.businesses (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  timezone     text NOT NULL DEFAULT 'America/Chicago',
  logo_url     text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. Profiles link to business and role enum already exists (role_t)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS business_id uuid;

ALTER TABLE public.profiles
  ADD CONSTRAINT IF NOT EXISTS profiles_business_fk
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;

-- 3. Employees link to business too
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS business_id uuid;

ALTER TABLE public.employees
  ADD CONSTRAINT IF NOT EXISTS employees_business_fk
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;

-- 4. Default profile row on auth user creation = Client. (Keeps clients simple.)
CREATE OR REPLACE FUNCTION public.set_default_client_profile()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'Client'::role_t)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS t_default_client_profile ON auth.users;
CREATE TRIGGER t_default_client_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.set_default_client_profile();

-- 5. First-owner onboarding helper. If NO businesses exist, create one and promote caller to Master.
CREATE OR REPLACE FUNCTION public.claim_first_owner(p_user uuid, p_business_name text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE v_bid uuid;
BEGIN
  SELECT id INTO v_bid FROM public.businesses LIMIT 1;

  IF v_bid IS NULL THEN
    INSERT INTO public.businesses (name) VALUES (COALESCE(p_business_name,'My Grooming Business')) RETURNING id INTO v_bid;

    UPDATE public.profiles
      SET role='Master Account'::role_t, business_id=v_bid
      WHERE id = p_user;

    INSERT INTO public.employees (user_id, name, active, role, business_id, app_permissions)
    VALUES (p_user, 'Owner', true, 'Manager', v_bid, '{"dashboard":true}'::jsonb)
    ON CONFLICT (user_id) DO UPDATE
      SET business_id=EXCLUDED.business_id,
          active=true,
          app_permissions=COALESCE(public.employees.app_permissions,'{}'::jsonb) || '{"dashboard":true}'::jsonb;

    RETURN v_bid;
  ELSE
    -- Business already exists => require invite flow. No change to role.
    RETURN v_bid;
  END IF;
END;
$$;

-- 6. Staff invites
CREATE TABLE IF NOT EXISTS public.staff_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  email        text NOT NULL,
  role         text NOT NULL CHECK (role IN ('Manager','Front Desk','Groomer')),
  token        text UNIQUE NOT NULL,
  created_by   uuid REFERENCES public.profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  accepted_at  timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_invites_business_email
  ON public.staff_invites(business_id, email) WHERE accepted_at IS NULL;

-- 7. RLS scoping by business for invites (admins can manage; others only see own)
ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS si_admin_all ON public.staff_invites;
CREATE POLICY si_admin_all ON public.staff_invites
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = staff_invites.business_id
      AND p.role::text IN ('Master Account','Manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.business_id = staff_invites.business_id
      AND p.role::text IN ('Master Account','Manager')
  )
);

COMMIT;

-- NOTE: We intentionally do NOT rewrite all tables to add business_id today.
-- RLS for other tables can derive business via joins (employees.user_id -> profiles.business_id).
