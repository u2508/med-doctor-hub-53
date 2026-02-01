-- Fix the SECURITY DEFINER view issue by using SECURITY INVOKER instead
DROP VIEW IF EXISTS public.public_doctor_profiles;

-- Recreate with SECURITY INVOKER (default, but explicit for clarity)
CREATE VIEW public.public_doctor_profiles 
WITH (security_invoker = true) AS
SELECT 
  dp.id,
  dp.user_id,
  dp.specialty,
  dp.years_experience,
  dp.hospital_affiliation,
  dp.is_approved,
  p.full_name
FROM doctor_profiles dp
JOIN profiles p ON p.user_id = dp.user_id
WHERE dp.is_approved = true;

-- Grant access to the view
GRANT SELECT ON public.public_doctor_profiles TO anon, authenticated;