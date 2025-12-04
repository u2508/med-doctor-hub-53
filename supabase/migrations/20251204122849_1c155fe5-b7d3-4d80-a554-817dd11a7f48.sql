-- Create admin_audit_logs table to track approval/rejection actions
CREATE TABLE public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL CHECK (action IN ('approved', 'rejected')),
  admin_id uuid NOT NULL,
  admin_full_name text NOT NULL,
  admin_email text NOT NULL,
  doctor_id uuid NOT NULL,
  doctor_full_name text NOT NULL,
  doctor_email text NOT NULL,
  specialty text NOT NULL,
  license_number text NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_logs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Create index for faster queries
CREATE INDEX idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_admin_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX idx_admin_audit_logs_doctor_id ON public.admin_audit_logs(doctor_id);