-- Allow anonymous users to upload doctor ID documents during registration
CREATE POLICY "Anonymous users can upload doctor IDs during registration"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'doctor-ids'
);

-- Allow authenticated users to upload their own doctor IDs
CREATE POLICY "Authenticated users can upload their own doctor IDs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'doctor-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view their own doctor IDs
CREATE POLICY "Users can view their own doctor IDs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'doctor-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can view all doctor IDs
CREATE POLICY "Admins can view all doctor IDs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'doctor-ids' AND
  has_role(auth.uid(), 'admin'::user_role)
);