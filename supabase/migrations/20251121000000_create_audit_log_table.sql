-- Create audit log table for tracking approval/rejection actions
CREATE TABLE IF NOT EXISTS public.doctor_approval_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_profile_id uuid REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN ('approved', 'rejected')),
  admin_user_id uuid REFERENCES auth.users(id) NOT NULL,
  admin_full_name text NOT NULL,
  admin_email text NOT NULL,
  doctor_user_id uuid REFERENCES auth.users(id) NOT NULL,
  doctor_full_name text NOT NULL,
  doctor_email text NOT NULL,
  specialty text NOT NULL,
  license_number text NOT NULL,
  reason text, -- Optional reason for rejection
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log table
ALTER TABLE public.doctor_approval_audit ENABLE ROW LEVEL SECURITY;

-- Create index for efficient querying
CREATE INDEX idx_doctor_approval_audit_doctor_profile_id ON public.doctor_approval_audit(doctor_profile_id);
CREATE INDEX idx_doctor_approval_audit_admin_user_id ON public.doctor_approval_audit(admin_user_id);
CREATE INDEX idx_doctor_approval_audit_created_at ON public.doctor_approval_audit(created_at DESC);

-- Allow admins to view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.doctor_approval_audit
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Allow admins to insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.doctor_approval_audit
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Function to log approval/rejection actions
CREATE OR REPLACE FUNCTION public.log_doctor_approval_action(
  p_doctor_profile_id uuid,
  p_action text,
  p_admin_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_doctor_profile public.doctor_profiles;
  v_admin_profile public.profiles;
  v_doctor_profile_record public.profiles;
BEGIN
  -- Get doctor profile details
  SELECT * INTO v_doctor_profile
  FROM public.doctor_profiles
  WHERE id = p_doctor_profile_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Doctor profile not found';
  END IF;

  -- Get admin profile details
  SELECT * INTO v_admin_profile
  FROM public.profiles
  WHERE user_id = p_admin_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin profile not found';
  END IF;

  -- Get doctor user profile details
  SELECT * INTO v_doctor_profile_record
  FROM public.profiles
  WHERE user_id = v_doctor_profile.user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Doctor user profile not found';
  END IF;

  -- Insert audit log
  INSERT INTO public.doctor_approval_audit (
    doctor_profile_id,
    action,
    admin_user_id,
    admin_full_name,
    admin_email,
    doctor_user_id,
    doctor_full_name,
    doctor_email,
    specialty,
    license_number,
    reason
  ) VALUES (
    p_doctor_profile_id,
    p_action,
    p_admin_user_id,
    v_admin_profile.full_name,
    v_admin_profile.email,
    v_doctor_profile.user_id,
    v_doctor_profile_record.full_name,
    v_doctor_profile_record.email,
    v_doctor_profile.specialty,
    v_doctor_profile.license_number,
    p_reason
  );
END;
$$;
