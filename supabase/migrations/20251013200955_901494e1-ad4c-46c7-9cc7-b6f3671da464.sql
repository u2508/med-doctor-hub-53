-- 1. Create dedicated user_roles table with proper architecture
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create secure has_role function with fixed search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. Update get_user_role function with proper security
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role_value user_role;
BEGIN
  -- Input validation
  IF user_id IS NULL THEN
    RETURN 'patient'::user_role;
  END IF;
  
  -- Query from user_roles table
  SELECT role INTO user_role_value
  FROM public.user_roles
  WHERE public.user_roles.user_id = get_user_role.user_id
  LIMIT 1;
  
  -- Return with safe default
  RETURN COALESCE(user_role_value, 'patient'::user_role);
END;
$$;

-- 4. Update handle_new_user function with fixed search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE LOG 'handle_new_user triggered for user_id: %', NEW.id;
  RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
  RAISE LOG 'User email: %', NEW.email;
  
  BEGIN
    -- Insert into public.profiles
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      NEW.email,
      COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'patient'::public.user_role)
    );
    
    -- Insert into user_roles table for proper role management
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'patient'::public.user_role)
    );
    
    RAISE LOG 'Successfully inserted profile and role for user_id: %', NEW.id;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'ERROR in handle_new_user for user_id %. SQLSTATE: %, SQLERRM: %', NEW.id, SQLSTATE, SQLERRM;
      RAISE;
  END;
  
  RETURN NEW;
END;
$$;

-- 5. Migrate existing role data from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 6. Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Only admins can grant roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. Update existing RLS policies to use has_role() where appropriate

-- Update appointments policies
DROP POLICY IF EXISTS "Doctors can create appointments" ON public.appointments;
CREATE POLICY "Doctors can create appointments" 
  ON public.appointments FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id);

DROP POLICY IF EXISTS "Doctors can view their own appointments" ON public.appointments;
CREATE POLICY "Doctors can view their own appointments" 
  ON public.appointments FOR SELECT 
  USING (public.has_role(auth.uid(), 'doctor') AND auth.uid() = doctor_id);

-- Update patients policies
DROP POLICY IF EXISTS "Doctors can only view their appointed patients" ON public.patients;
CREATE POLICY "Doctors can only view their appointed patients" 
  ON public.patients FOR SELECT 
  USING (
    (auth.uid() = user_id) OR 
    (public.has_role(auth.uid(), 'doctor') AND EXISTS (
      SELECT 1 FROM appointments 
      WHERE appointments.patient_id = patients.user_id 
      AND appointments.doctor_id = auth.uid()
    ))
  );

-- Grant appropriate permissions
REVOKE ALL ON FUNCTION public.get_user_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.has_role(uuid, user_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, user_role) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Securely retrieves user role. Returns patient as default if user not found.';
COMMENT ON FUNCTION public.has_role(uuid, user_role) IS 'Securely checks if a user has a specific role. Returns false if user not found.';
COMMENT ON TABLE public.user_roles IS 'Stores user role assignments separately from profiles to prevent privilege escalation.';