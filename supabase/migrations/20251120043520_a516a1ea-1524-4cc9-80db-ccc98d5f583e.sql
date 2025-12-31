-- Add storage policies for doctor ID uploads
CREATE POLICY "Users can upload their own doctor ID documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'doctor-ids' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own doctor ID documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'doctor-ids' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all doctor ID documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'doctor-ids' 
  AND has_role(auth.uid(), 'admin'::user_role)
);