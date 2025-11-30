-- Allow completely unauthenticated uploads to doctor-ids bucket

-- Drop existing doctor-ids policies
DROP POLICY IF EXISTS "doctor_ids_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "doctor_ids_auth_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "doctor_ids_auth_select_own" ON storage.objects;
DROP POLICY IF EXISTS "doctor_ids_auth_update_own" ON storage.objects;
DROP POLICY IF EXISTS "doctor_ids_auth_delete_own" ON storage.objects;
DROP POLICY IF EXISTS "doctor_ids_admin_select_all" ON storage.objects;

-- Allow anyone to upload to doctor-ids bucket (no auth required)
CREATE POLICY "doctor_ids_public_insert"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'doctor-ids'
);

-- Allow authenticated users to view their own documents
CREATE POLICY "doctor_ids_auth_select_own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'doctor-ids'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own documents
CREATE POLICY "doctor_ids_auth_update_own"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'doctor-ids'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own documents
CREATE POLICY "doctor_ids_auth_delete_own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'doctor-ids'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to view all doctor ID documents
CREATE POLICY "doctor_ids_admin_select_all"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'doctor-ids'
  AND has_role(auth.uid(), 'admin'::user_role)
);