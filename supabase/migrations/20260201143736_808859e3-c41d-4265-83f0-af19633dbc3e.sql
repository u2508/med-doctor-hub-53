-- FIX 1: Drop the overly permissive public policy on profiles table
-- This policy exposes email and phone numbers to unauthenticated users
DROP POLICY IF EXISTS "Anyone can view basic info of approved doctors" ON public.profiles;

-- Create a restricted policy that only allows authenticated users to view approved doctor profiles
CREATE POLICY "Authenticated users can view approved doctor names"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles
    WHERE doctor_profiles.user_id = profiles.user_id
    AND doctor_profiles.is_approved = true
  )
);

-- FIX 2: Drop the overly permissive policy on doctor_profiles that exposes license numbers
DROP POLICY IF EXISTS "Approved doctors visible - limited fields via view" ON public.doctor_profiles;

-- The public_doctor_profiles view should be used for public access (it already excludes sensitive fields)
-- Direct doctor_profiles table access should be restricted to owners and admins only
-- The existing policies for "Users can view their own doctor profile" and "Admins can view all doctor profiles" already handle this correctly