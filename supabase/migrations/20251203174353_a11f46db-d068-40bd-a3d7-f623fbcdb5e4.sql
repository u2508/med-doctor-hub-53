-- Add prescription_file_url column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS prescription_file_url TEXT;

-- Create storage bucket for prescriptions
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescriptions', 'prescriptions', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for prescriptions bucket
-- Doctors can upload prescriptions for their appointments
CREATE POLICY "Doctors can upload prescriptions"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'prescriptions' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE doctor_id = auth.uid() 
    AND id::text = (storage.foldername(name))[1]
  )
);

-- Doctors can view prescriptions they uploaded
CREATE POLICY "Doctors can view their prescriptions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescriptions'
  AND EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE doctor_id = auth.uid() 
    AND id::text = (storage.foldername(name))[1]
  )
);

-- Patients can view prescriptions for their appointments
CREATE POLICY "Patients can view their prescriptions"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'prescriptions'
  AND EXISTS (
    SELECT 1 FROM public.appointments 
    WHERE patient_id = auth.uid() 
    AND id::text = (storage.foldername(name))[1]
  )
);