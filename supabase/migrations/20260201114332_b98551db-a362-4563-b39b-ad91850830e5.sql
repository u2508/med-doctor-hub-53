-- Create chat_conversations table
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New Chat',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_summaries table for daily AI summaries
CREATE TABLE public.chat_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  summary_date DATE NOT NULL,
  summary_text TEXT NOT NULL,
  mood_indicators TEXT[],
  key_concerns TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(patient_id, summary_date)
);

-- Create patient_notes table for doctor comments on summaries
CREATE TABLE public.patient_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  note_type TEXT NOT NULL CHECK (note_type IN ('patient_summary', 'doctor_note', 'report')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary_id UUID REFERENCES public.chat_summaries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_notes ENABLE ROW LEVEL SECURITY;

-- RLS for chat_conversations
CREATE POLICY "Users can view their own conversations"
ON public.chat_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
ON public.chat_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.chat_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
ON public.chat_conversations FOR DELETE
USING (auth.uid() = user_id);

-- RLS for chat_messages
CREATE POLICY "Users can view their own messages"
ON public.chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own messages"
ON public.chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS for chat_summaries
CREATE POLICY "Patients can view their own summaries"
ON public.chat_summaries FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create their own summaries"
ON public.chat_summaries FOR INSERT
WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can view patient summaries for valid appointments"
ON public.chat_summaries FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::user_role) AND
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.patient_id = chat_summaries.patient_id
    AND appointments.doctor_id = auth.uid()
    AND appointments.status IN ('confirmed', 'completed')
    AND appointments.appointment_date >= CURRENT_DATE - INTERVAL '7 days'
    AND appointments.appointment_date <= CURRENT_DATE + INTERVAL '7 days'
  )
);

-- RLS for patient_notes
CREATE POLICY "Patients can view their own notes"
ON public.patient_notes FOR SELECT
USING (auth.uid() = patient_id);

CREATE POLICY "Patients can create their own notes (patient_summary type only)"
ON public.patient_notes FOR INSERT
WITH CHECK (auth.uid() = patient_id AND note_type = 'patient_summary');

CREATE POLICY "Doctors can view patient notes for valid appointments"
ON public.patient_notes FOR SELECT
USING (
  has_role(auth.uid(), 'doctor'::user_role) AND
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.patient_id = patient_notes.patient_id
    AND appointments.doctor_id = auth.uid()
    AND appointments.status IN ('confirmed', 'completed')
    AND appointments.appointment_date >= CURRENT_DATE - INTERVAL '7 days'
    AND appointments.appointment_date <= CURRENT_DATE + INTERVAL '7 days'
  )
);

CREATE POLICY "Doctors can create notes for their patients"
ON public.patient_notes FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'doctor'::user_role) AND
  auth.uid() = doctor_id AND
  EXISTS (
    SELECT 1 FROM appointments
    WHERE appointments.patient_id = patient_notes.patient_id
    AND appointments.doctor_id = auth.uid()
    AND appointments.status IN ('confirmed', 'completed')
  )
);

CREATE POLICY "Doctors can update their own notes"
ON public.patient_notes FOR UPDATE
USING (auth.uid() = doctor_id);

-- Triggers for updated_at
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_notes_updated_at
BEFORE UPDATE ON public.patient_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX idx_chat_summaries_patient_date ON public.chat_summaries(patient_id, summary_date);
CREATE INDEX idx_patient_notes_patient_id ON public.patient_notes(patient_id);