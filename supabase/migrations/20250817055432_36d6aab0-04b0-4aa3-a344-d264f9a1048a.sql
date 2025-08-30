-- Create a special policy for the trigger function to insert profiles
CREATE POLICY "Allow trigger to insert profiles" ON public.profiles
FOR INSERT 
WITH CHECK (true);

-- Update the trigger function to work better with RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  -- Insert into public.profiles bypassing RLS by using a security definer function
  -- The trigger runs with elevated privileges
  PERFORM set_config('role', 'service_role', true);
  
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'patient'::public.user_role)
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it
    RAISE LOG 'Error in handle_new_user: % - %', SQLSTATE, SQLERRM;
    RAISE;
END;
$$;