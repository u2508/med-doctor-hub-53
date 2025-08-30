-- Create storage bucket for doctor ID uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('doctor-ids', 'doctor-ids', false);

-- Create policies for doctor ID uploads
CREATE POLICY "Doctors can upload their own ID documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'doctor-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Doctors can view their own ID documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'doctor-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Doctors can update their own ID documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'doctor-ids' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Doctors can delete their own ID documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'doctor-ids' AND auth.uid()::text = (storage.foldername(name))[1]);