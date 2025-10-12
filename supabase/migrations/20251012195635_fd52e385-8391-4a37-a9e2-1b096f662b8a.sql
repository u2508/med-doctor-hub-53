-- Drop existing policies on mood_entries
DROP POLICY IF EXISTS "Users can create their own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Users can delete their own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Users can update their own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "Users can view their own mood entries" ON public.mood_entries;

-- Create new policies with explicit authentication checks
-- These policies will ONLY allow authenticated users to access their own data

CREATE POLICY "Authenticated users can create their own mood entries" 
ON public.mood_entries 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can view their own mood entries" 
ON public.mood_entries 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own mood entries" 
ON public.mood_entries 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own mood entries" 
ON public.mood_entries 
FOR DELETE 
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Add explicit deny policy for unauthenticated users (belt and suspenders approach)
CREATE POLICY "Deny all access to unauthenticated users" 
ON public.mood_entries 
FOR ALL 
TO anon
USING (false);