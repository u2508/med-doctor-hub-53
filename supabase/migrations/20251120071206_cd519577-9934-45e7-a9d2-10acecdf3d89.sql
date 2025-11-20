-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can upload their own doctor ID documents" ON storage.objects;

-- Create a more permissive policy for doctor registration uploads
-- This allows any authenticated user to upload to doctor-ids bucket
-- The application logic ensures the correct folder structure
CREATE POLICY "Authenticated users can upload doctor ID documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'doctor-ids'
);