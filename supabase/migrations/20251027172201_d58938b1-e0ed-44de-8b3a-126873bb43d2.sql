-- Make audio_tracks bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'audio_tracks';

-- Create RLS policy for public read access to audio tracks
CREATE POLICY "Audio tracks are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audio_tracks');

-- Allow authenticated users to upload audio tracks (for future admin functionality)
CREATE POLICY "Authenticated users can upload audio tracks"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'audio_tracks');