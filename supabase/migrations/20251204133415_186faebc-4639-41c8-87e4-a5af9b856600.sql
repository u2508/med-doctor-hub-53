-- Add additional vital signs columns
ALTER TABLE public.vitals 
ADD COLUMN IF NOT EXISTS oxygen_saturation integer,
ADD COLUMN IF NOT EXISTS respiratory_rate integer;

-- Add comments for documentation
COMMENT ON COLUMN public.vitals.oxygen_saturation IS 'Blood oxygen saturation percentage (SpO2)';
COMMENT ON COLUMN public.vitals.respiratory_rate IS 'Breaths per minute';