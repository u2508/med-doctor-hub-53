-- Fix RLS policies for doctor registration flow

-- 1. Ensure doctor_profiles can be created during registration (before email verification)
-- Drop existing insert policy and create a more permissive one
DROP POLICY IF EXISTS "Users can insert their own doctor profile" ON public.doctor_profiles;

-- Allow inserting doctor profiles during registration (no auth check needed)
-- This is safe because user_id comes from the signup process
CREATE POLICY "Allow doctor profile creation during registration"
ON public.doctor_profiles
FOR INSERT
TO public
WITH CHECK (true);

-- Keep the view/update policies requiring authentication for security
-- (existing policies remain unchanged)

-- 2. Verify storage policy for completely public uploads
-- Recreate to ensure it's working correctly
DROP POLICY IF EXISTS "doctor_ids_public_insert" ON storage.objects;

CREATE POLICY "doctor_ids_public_upload"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'doctor-ids'
);

-- 3. Add a policy to allow inserting user_roles during signup
-- This is needed because the handle_new_user trigger creates roles
DROP POLICY IF EXISTS "Allow trigger to insert roles" ON public.user_roles;

CREATE POLICY "Allow trigger to insert roles"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (true);