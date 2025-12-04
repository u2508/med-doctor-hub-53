-- Create medications table for tracking patient medications
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  instructions TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  refill_date DATE,
  refill_reminder_sent BOOLEAN DEFAULT false,
  quantity INTEGER,
  remaining_quantity INTEGER,
  prescribing_doctor TEXT,
  pharmacy TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Patients can manage their own medications
CREATE POLICY "Patients can view their own medications"
ON public.medications FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can insert their own medications"
ON public.medications FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Patients can update their own medications"
ON public.medications FOR UPDATE
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can delete their own medications"
ON public.medications FOR DELETE
USING (auth.uid() = patient_id);

-- Doctors can view medications for patients with confirmed appointments
CREATE POLICY "Doctors can view patient medications for valid appointments"
ON public.medications FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::user_role) 
  AND EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.patient_id = medications.patient_id
    AND appointments.doctor_id = auth.uid()
    AND appointments.status IN ('confirmed', 'completed')
    AND appointments.appointment_date >= (CURRENT_DATE - INTERVAL '7 days')
    AND appointments.appointment_date <= (CURRENT_DATE + INTERVAL '7 days')
  )
);

-- Add appointment reminder tracking columns
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS reminder_24h_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_1h_sent BOOLEAN DEFAULT false;

-- Create trigger for medications updated_at
CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();