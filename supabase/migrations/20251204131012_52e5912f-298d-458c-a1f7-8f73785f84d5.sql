-- Create vitals table for patient health tracking
CREATE TABLE public.vitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  temperature NUMERIC(4,1),
  weight NUMERIC(5,1),
  height NUMERIC(5,1),
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vitals ENABLE ROW LEVEL SECURITY;

-- Patients can insert their own vitals
CREATE POLICY "Patients can insert their own vitals"
ON public.vitals
FOR INSERT
WITH CHECK (auth.uid() = patient_id);

-- Patients can view their own vitals
CREATE POLICY "Patients can view their own vitals"
ON public.vitals
FOR SELECT
USING (auth.uid() = patient_id);

-- Patients can update their own vitals
CREATE POLICY "Patients can update their own vitals"
ON public.vitals
FOR UPDATE
USING (auth.uid() = patient_id);

-- Patients can delete their own vitals
CREATE POLICY "Patients can delete their own vitals"
ON public.vitals
FOR DELETE
USING (auth.uid() = patient_id);

-- Doctors can view vitals for patients with confirmed/completed appointments within 7 days
CREATE POLICY "Doctors can view patient vitals for valid appointments"
ON public.vitals
FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::user_role) AND 
  EXISTS (
    SELECT 1 FROM appointments 
    WHERE appointments.patient_id = vitals.patient_id 
    AND appointments.doctor_id = auth.uid() 
    AND appointments.status IN ('confirmed', 'completed')
    AND appointments.appointment_date >= (CURRENT_DATE - INTERVAL '7 days')
    AND appointments.appointment_date <= (CURRENT_DATE + INTERVAL '7 days')
  )
);

-- Add index for performance
CREATE INDEX idx_vitals_patient_id ON public.vitals(patient_id);
CREATE INDEX idx_vitals_appointment_id ON public.vitals(appointment_id);
CREATE INDEX idx_vitals_recorded_at ON public.vitals(recorded_at DESC);