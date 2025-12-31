-- Fix storage RLS for doctor-ids bucket by applying policies to `public`

-- Drop existing doctor-ids specific policies
DROP POLICY IF EXISTS "Anonymous users can upload doctor IDs during registration" ON storage.objects;
DROP POLICY IF EXISTS "anon_upload_doctor_ids" ON storage.objects;
DROP POLICY IF EXISTS "auth_upload_own_doctor_ids" ON storage.objects;
DROP POLICY IF EXISTS "auth_view_own_doctor_ids" ON storage.objects;
DROP POLICY IF EXISTS "auth_update_own_doctor_ids" ON storage.objects;
DROP POLICY IF EXISTS "auth_delete_own_doctor_ids" ON storage.objects;
DROP POLICY IF EXISTS "admin_view_all_doctor_ids" ON storage.objects;

-- Allow anonymous users (JWT role = anon) to upload to doctor-ids during registration
CREATE POLICY "doctor_ids_anon_insert"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'doctor-ids'
  AND auth.role() = 'anon'
);

-- Allow authenticated users to upload their own doctor ID documents
CREATE POLICY "doctor_ids_auth_insert_own"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'doctor-ids'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own doctor ID documents
CREATE POLICY "doctor_ids_auth_select_own"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'doctor-ids'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own doctor ID documents
CREATE POLICY "doctor_ids_auth_update_own"
ON storage.objects
FOR UPDATE
TO public
USING (
  bucket_id = 'doctor-ids'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own doctor ID documents
CREATE POLICY "doctor_ids_auth_delete_own"
ON storage.objects
FOR DELETE
TO public
USING (
  bucket_id = 'doctor-ids'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all doctor ID documents
CREATE POLICY "doctor_ids_admin_select_all"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'doctor-ids'
  AND auth.role() = 'authenticated'
  AND has_role(auth.uid(), 'admin'::user_role)
);