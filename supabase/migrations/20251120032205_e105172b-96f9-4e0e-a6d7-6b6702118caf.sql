-- Add approval status to doctor_profiles
ALTER TABLE public.doctor_profiles 
ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT false;

-- Add approval tracking columns
ALTER TABLE public.doctor_profiles 
ADD COLUMN approved_by UUID REFERENCES auth.users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Create index for querying unapproved doctors
CREATE INDEX idx_doctor_profiles_is_approved ON public.doctor_profiles(is_approved);

-- Update RLS policy to allow admins to view all doctor profiles for approval
CREATE POLICY "Admins can view all doctor profiles"
ON public.doctor_profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to update doctor profiles for approval
CREATE POLICY "Admins can update doctor profiles for approval"
ON public.doctor_profiles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role))
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));