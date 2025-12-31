-- Create user_interactions table to track all user activities
CREATE TABLE IF NOT EXISTS public.user_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('mood_entry', 'meditation', 'chatbot', 'appointment', 'stress_management')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_interactions table
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_interactions
CREATE POLICY "Users can view their own interactions"
  ON public.user_interactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own interactions"
  ON public.user_interactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_user_interactions_user_id_created_at
  ON public.user_interactions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_interactions_type
  ON public.user_interactions (interaction_type);

-- Add helpful comments
COMMENT ON TABLE public.user_interactions IS 'Tracks all user interactions with the app for dashboard visibility';
COMMENT ON COLUMN public.user_interactions.interaction_type IS 'Type of interaction: mood_entry, meditation, chatbot, appointment, stress_management';
COMMENT ON COLUMN public.user_interactions.metadata IS 'Additional data specific to the interaction type (e.g., duration, mood level, etc.)';
