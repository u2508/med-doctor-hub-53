-- Drop existing restrictive policy for patients creating appointments
DROP POLICY IF EXISTS "Patients can create appointments" ON appointments;

-- Create new policy allowing any authenticated user to book appointments where they are the patient
CREATE POLICY "Users can create their own appointments" ON appointments
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);