-- Drop duplicate and conflicting policies for doctor-ids bucket
DROP POLICY IF EXISTS "Authenticated users can upload doctor ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload their own doctor IDs" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can upload their own ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can update their own ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can delete their own ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Doctors can view their own ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own doctor ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own doctor IDs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all doctor ID documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all doctor IDs" ON storage.objects;

-- Create clean, non-conflicting policies for doctor-ids bucket

-- Allow anonymous users to upload during registration (no path restriction)
CREATE POLICY "anon_upload_doctor_ids"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'doctor-ids'
);

-- Allow authenticated users to manage their own documents
CREATE POLICY "auth_upload_own_doctor_ids"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'doctor-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "auth_view_own_doctor_ids"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'doctor-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "auth_update_own_doctor_ids"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'doctor-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "auth_delete_own_doctor_ids"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'doctor-ids' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all doctor IDs
CREATE POLICY "admin_view_all_doctor_ids"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'doctor-ids' AND
  has_role(auth.uid(), 'admin'::user_role)
);