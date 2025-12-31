-- Add extensive logging to the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  RAISE LOG 'handle_new_user triggered for user_id: %', NEW.id;
  RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
  RAISE LOG 'User email: %', NEW.email;
  
  BEGIN
    -- Insert into public.profiles with detailed logging
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
      NEW.email,
      COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'patient'::public.user_role)
    );
    
    RAISE LOG 'Successfully inserted profile for user_id: %', NEW.id;
    
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'ERROR in handle_new_user for user_id %. SQLSTATE: %, SQLERRM: %', NEW.id, SQLSTATE, SQLERRM;
      RAISE;
  END;
  
  RETURN NEW;
END;
$$;