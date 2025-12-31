
-- First, let's ensure we have the correct user_role enum type
CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');

-- Make sure the profiles table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',  
  phone text,
  role user_role NOT NULL DEFAULT 'patient',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles; 
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Make sure the doctor_profiles table exists with the correct structure
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  specialty text NOT NULL,
  license_number text NOT NULL,
  years_experience integer,
  hospital_affiliation text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on doctor_profiles table
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for doctor_profiles
DROP POLICY IF EXISTS "Users can insert their own doctor profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Users can view their own doctor profile" ON public.doctor_profiles;
DROP POLICY IF EXISTS "Users can update their own doctor profile" ON public.doctor_profiles;

CREATE POLICY "Users can insert their own doctor profile" 
  ON public.doctor_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own doctor profile" 
  ON public.doctor_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own doctor profile" 
  ON public.doctor_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Update the handle_new_user function to work correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'patient')
  );
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Update the get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE profiles.user_id = $1;
$$;
