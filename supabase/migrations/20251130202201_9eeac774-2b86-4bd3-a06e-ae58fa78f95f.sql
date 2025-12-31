-- Add policy to allow anyone (including unauthenticated users) to view approved doctor profiles
CREATE POLICY "Anyone can view approved doctor profiles"
ON public.doctor_profiles
FOR SELECT
TO public
USING (is_approved = true);

-- Add policy to allow anyone to view profiles of approved doctors
CREATE POLICY "Anyone can view profiles of approved doctors"
ON public.profiles
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM doctor_profiles
    WHERE doctor_profiles.user_id = profiles.user_id
      AND doctor_profiles.is_approved = true
  )
);