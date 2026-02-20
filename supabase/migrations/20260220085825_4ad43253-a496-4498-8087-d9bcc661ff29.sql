
-- Create curriculum_progress table (replaces localStorage tracking)
CREATE TABLE public.curriculum_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  language_code TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completion_percent INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE public.curriculum_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own curriculum progress"
ON public.curriculum_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own curriculum progress"
ON public.curriculum_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own curriculum progress"
ON public.curriculum_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own curriculum progress"
ON public.curriculum_progress FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_curriculum_progress_updated_at
BEFORE UPDATE ON public.curriculum_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update skill display names to English (currently in Swedish)
UPDATE public.skills SET display_name = 'Listening' WHERE key = 'listening';
UPDATE public.skills SET display_name = 'Reading' WHERE key = 'reading';
UPDATE public.skills SET display_name = 'Speaking' WHERE key = 'speaking';
UPDATE public.skills SET display_name = 'Writing' WHERE key = 'writing';
UPDATE public.skills SET display_name = 'Grammar' WHERE key = 'grammar';
UPDATE public.skills SET display_name = 'Vocabulary' WHERE key = 'vocabulary';
