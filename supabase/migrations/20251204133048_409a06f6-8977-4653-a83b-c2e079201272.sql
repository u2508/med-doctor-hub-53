-- Allow doctors to insert vitals for patients with confirmed/completed appointments
CREATE POLICY "Doctors can insert vitals for valid appointments"
ON public.vitals
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'doctor'::user_role) 
  AND EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.patient_id = vitals.patient_id
    AND appointments.doctor_id = auth.uid()
    AND appointments.status IN ('confirmed', 'completed')
    AND appointments.appointment_date >= (CURRENT_DATE - INTERVAL '7 days')
    AND appointments.appointment_date <= (CURRENT_DATE + INTERVAL '7 days')
  )
);