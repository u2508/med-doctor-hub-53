-- Update RLS policy for patients table to allow doctors to see patient details
-- only for confirmed appointments within 7 days from appointment date
DROP POLICY IF EXISTS "Doctors can only view their appointed patients" ON public.patients;

CREATE POLICY "Doctors can view appointed patients within 7 days"
ON public.patients
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR 
  (
    has_role(auth.uid(), 'doctor'::user_role) 
    AND EXISTS (
      SELECT 1
      FROM appointments
      WHERE appointments.patient_id = patients.user_id
        AND appointments.doctor_id = auth.uid()
        AND appointments.status = 'confirmed'
        AND appointments.appointment_date >= CURRENT_DATE
        AND appointments.appointment_date <= CURRENT_DATE + INTERVAL '7 days'
    )
  )
);

-- Add policy for patients to create appointments
CREATE POLICY "Patients can create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'patient'::user_role) AND auth.uid() = patient_id);