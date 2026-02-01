-- Allow doctors to view patient mood entries for valid appointments (similar to chat_summaries)
CREATE POLICY "Doctors can view patient mood entries for valid appointments"
ON public.mood_entries
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::user_role) 
  AND EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.patient_id = mood_entries.user_id
    AND appointments.doctor_id = auth.uid()
    AND appointments.status = ANY (ARRAY['confirmed'::text, 'completed'::text])
    AND appointments.appointment_date >= (CURRENT_DATE - '7 days'::interval)
    AND appointments.appointment_date <= (CURRENT_DATE + '7 days'::interval)
  )
);