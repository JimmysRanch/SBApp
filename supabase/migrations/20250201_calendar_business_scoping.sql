-- Add business_id to calendar_events for multi-tenancy support
BEGIN;

-- Add business_id column to calendar_events if it doesn't exist
ALTER TABLE public.calendar_events 
  ADD COLUMN IF NOT EXISTS business_id uuid;

-- Add foreign key constraint
ALTER TABLE public.calendar_events
  ADD CONSTRAINT IF NOT EXISTS calendar_events_business_fk
  FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_business_id 
  ON public.calendar_events(business_id);

-- Update existing records to inherit business_id from staff/employees
-- This assumes staffId in calendar_events corresponds to employees.id
UPDATE public.calendar_events ce
SET business_id = e.business_id
FROM public.employees e
WHERE ce."staffId" = e.id::text 
  AND ce.business_id IS NULL 
  AND e.business_id IS NOT NULL;

COMMIT;