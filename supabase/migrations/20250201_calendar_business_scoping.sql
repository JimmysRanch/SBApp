-- Add business_id to calendar_events for multi-tenancy support
BEGIN;

-- Add business_id column to calendar_events if it doesn't exist
ALTER TABLE public.calendar_events
  ADD COLUMN IF NOT EXISTS business_id uuid;

-- Add foreign key constraint safely (Postgres has no IF NOT EXISTS for constraints)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'calendar_events'
      AND c.conname = 'calendar_events_business_fk'
  ) THEN
    EXECUTE $C$
      ALTER TABLE public.calendar_events
        ADD CONSTRAINT calendar_events_business_fk
        FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
    $C$;
  END IF;
END$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_business_id
  ON public.calendar_events(business_id);

-- Backfill from employees (assuming staffId refers to employees.id)
UPDATE public.calendar_events ce
SET business_id = e.business_id
FROM public.employees e
WHERE ce."staffId" = e.id::text
  AND ce.business_id IS NULL
  AND e.business_id IS NOT NULL;

COMMIT;
