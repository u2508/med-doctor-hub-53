-- Fix security vulnerability: Restrict doctors to only view their own patients
-- Doctors should only see patient data for patients they have appointments with

-- Drop the overly permissive policy that allows all doctors to see all patients
DROP POLICY IF EXISTS "Doctors can view their patients data" ON public.patients;

-- Create a new restrictive policy that only allows doctors to see patients they have appointments with
CREATE POLICY "Doctors can only view their appointed patients" 
ON public.patients 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR 
  (
    get_user_role(auth.uid()) = 'doctor'::user_role 
    AND EXISTS (
      SELECT 1 
      FROM public.appointments 
      WHERE appointments.patient_id = patients.user_id 
      AND appointments.doctor_id = auth.uid()
    )
  )
);

-- Add a comment explaining the security fix
COMMENT ON POLICY "Doctors can only view their appointed patients" ON public.patients IS 
'Security fix: Doctors can only view patient records for patients they have appointments with, preventing unauthorized access to all patient data.';