-- Drop the old check constraint
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add new check constraint with all status values
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed'));

-- Update any existing 'pending' status to 'scheduled'
UPDATE public.appointments SET status = 'scheduled' WHERE status NOT IN ('scheduled', 'confirmed', 'cancelled', 'completed');