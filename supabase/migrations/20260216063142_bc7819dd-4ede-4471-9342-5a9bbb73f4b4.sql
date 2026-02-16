
-- 1. Lesson-Descriptor mapping table
-- Links lessons to the CEFR descriptors they train toward
CREATE TABLE public.lesson_descriptor_map (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  descriptor_id INTEGER NOT NULL REFERENCES public.cefr_descriptors(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, descriptor_id)
);

ALTER TABLE public.lesson_descriptor_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lesson descriptor maps are publicly readable"
  ON public.lesson_descriptor_map FOR SELECT
  USING (true);

CREATE POLICY "Authors and admins can manage lesson descriptor maps"
  ON public.lesson_descriptor_map FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'author'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Authors and admins can update lesson descriptor maps"
  ON public.lesson_descriptor_map FOR UPDATE
  USING (
    has_role(auth.uid(), 'author'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete lesson descriptor maps"
  ON public.lesson_descriptor_map FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Descriptor validation requirements
-- Stores thresholds needed to "achieve" a descriptor
CREATE TABLE public.descriptor_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descriptor_id INTEGER NOT NULL REFERENCES public.cefr_descriptors(id) ON DELETE CASCADE UNIQUE,
  required_grammar_elements TEXT[] DEFAULT '{}'::TEXT[],
  required_vocabulary_range TEXT[] DEFAULT '{}'::TEXT[],
  minimum_complexity_score INTEGER NOT NULL DEFAULT 60,
  minimum_accuracy_score INTEGER NOT NULL DEFAULT 70,
  required_success_count INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.descriptor_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Descriptor requirements are publicly readable"
  ON public.descriptor_requirements FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage descriptor requirements"
  ON public.descriptor_requirements FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_descriptor_requirements_updated_at
  BEFORE UPDATE ON public.descriptor_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. User descriptor progress tracking
-- Tracks each user's progress toward achieving descriptors
CREATE TABLE public.user_descriptor_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  descriptor_id INTEGER NOT NULL REFERENCES public.cefr_descriptors(id) ON DELETE CASCADE,
  language_id UUID NOT NULL REFERENCES public.languages(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'achieved', 'mastered')),
  success_count INTEGER NOT NULL DEFAULT 0,
  best_performance_score INTEGER DEFAULT 0,
  last_grammar_accuracy REAL DEFAULT 0,
  last_lexical_diversity REAL DEFAULT 0,
  last_complexity_score REAL DEFAULT 0,
  achieved_at TIMESTAMP WITH TIME ZONE,
  mastered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, descriptor_id, language_id)
);

ALTER TABLE public.user_descriptor_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own descriptor progress"
  ON public.user_descriptor_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own descriptor progress"
  ON public.user_descriptor_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own descriptor progress"
  ON public.user_descriptor_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own descriptor progress"
  ON public.user_descriptor_progress FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_descriptor_progress_updated_at
  BEFORE UPDATE ON public.user_descriptor_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Performance evaluations log
-- Stores detailed evaluation results from Phase 4 free performance tasks
CREATE TABLE public.performance_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  descriptor_id INTEGER NOT NULL REFERENCES public.cefr_descriptors(id) ON DELETE CASCADE,
  phase TEXT NOT NULL DEFAULT 'free_performance',
  grammar_accuracy REAL NOT NULL DEFAULT 0,
  lexical_diversity REAL NOT NULL DEFAULT 0,
  complexity_score REAL NOT NULL DEFAULT 0,
  fluency_score REAL DEFAULT 0,
  overall_score INTEGER NOT NULL DEFAULT 0,
  evaluation_details JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evaluations"
  ON public.performance_evaluations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own evaluations"
  ON public.performance_evaluations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Add phases column to lessons table for the 4-phase structure
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS phases JSONB DEFAULT '[]'::JSONB;

-- 6. Add descriptor_ids array to lessons for quick reference
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS descriptor_ids INTEGER[] DEFAULT '{}'::INTEGER[];

-- Create indexes for performance
CREATE INDEX idx_lesson_descriptor_map_lesson ON public.lesson_descriptor_map(lesson_id);
CREATE INDEX idx_lesson_descriptor_map_descriptor ON public.lesson_descriptor_map(descriptor_id);
CREATE INDEX idx_user_descriptor_progress_user ON public.user_descriptor_progress(user_id);
CREATE INDEX idx_user_descriptor_progress_status ON public.user_descriptor_progress(status);
CREATE INDEX idx_performance_evaluations_user ON public.performance_evaluations(user_id);
CREATE INDEX idx_performance_evaluations_lesson ON public.performance_evaluations(lesson_id);
