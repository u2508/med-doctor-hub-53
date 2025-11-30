-- Drop existing RLS policy for doctors viewing patient profiles
DROP POLICY IF EXISTS "Doctors can view profiles of scheduled patients" ON public.profiles;

-- Create new policy to allow doctors to view basic profile info for any appointment (scheduled or confirmed)
CREATE POLICY "Doctors can view profiles of scheduled patients"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM appointments
    WHERE appointments.patient_id = profiles.user_id
      AND appointments.doctor_id = auth.uid()
      AND appointments.status IN ('scheduled', 'confirmed')
      AND appointments.appointment_date >= CURRENT_DATE
      AND appointments.appointment_date <= (CURRENT_DATE + '7 days'::interval)
  )
);

-- Update the existing policy for detailed patient data to only work with confirmed appointments
DROP POLICY IF EXISTS "Doctors can view appointed patients within 7 days" ON public.patients;

CREATE POLICY "Doctors can view confirmed patient details within 7 days"
ON public.patients
FOR SELECT
USING (
  auth.uid() = user_id 
  OR (
    has_role(auth.uid(), 'doctor'::user_role) 
    AND EXISTS (
      SELECT 1
      FROM appointments
      WHERE appointments.patient_id = patients.user_id
        AND appointments.doctor_id = auth.uid()
        AND appointments.status = 'confirmed'
        AND appointments.appointment_date >= CURRENT_DATE
        AND appointments.appointment_date <= (CURRENT_DATE + '7 days'::interval)
    )
  )
);