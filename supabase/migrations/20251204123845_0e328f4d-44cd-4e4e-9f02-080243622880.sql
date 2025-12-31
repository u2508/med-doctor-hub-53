-- Drop existing policies for doctor-ids bucket
DROP POLICY IF EXISTS "Allow public uploads to doctor-ids bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to doctor-ids bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own doctor-ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own doctor-ids" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own doctor-ids" ON storage.objects;

-- Create policy: Only authenticated users can upload to their own folder
CREATE POLICY "Authenticated users can upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'doctor-ids' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy: Users can view their own files
CREATE POLICY "Users can view their own doctor-ids"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'doctor-ids' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy: Users can update their own files
CREATE POLICY "Users can update their own doctor-ids"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'doctor-ids' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy: Users can delete their own files
CREATE POLICY "Users can delete their own doctor-ids"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'doctor-ids' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy: Admins can view all doctor-ids for verification
CREATE POLICY "Admins can view all doctor-ids"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'doctor-ids' 
  AND public.has_role(auth.uid(), 'admin'::user_role)
);