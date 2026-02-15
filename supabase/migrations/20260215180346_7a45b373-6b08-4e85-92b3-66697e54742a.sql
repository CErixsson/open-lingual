
-- 1. Update default ELO to 1200 for new users
ALTER TABLE public.user_language_profiles ALTER COLUMN overall_elo SET DEFAULT 1200;
ALTER TABLE public.user_skill_ratings ALTER COLUMN elo SET DEFAULT 1200;

-- 2. Create scenario_packs table
CREATE TABLE public.scenario_packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  icon_name TEXT DEFAULT 'Package',
  rating_threshold INTEGER DEFAULT 0,
  is_premium BOOLEAN DEFAULT false,
  pack_order INTEGER DEFAULT 0,
  language_id UUID REFERENCES public.languages(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scenario_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scenario packs are publicly readable" ON public.scenario_packs FOR SELECT USING (true);

-- 3. Create scenarios table
CREATE TABLE public.scenarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cefr_target TEXT NOT NULL DEFAULT 'A2',
  topic TEXT NOT NULL DEFAULT 'general',
  grammar_targets TEXT[] DEFAULT '{}',
  vocabulary_clusters TEXT[] DEFAULT '{}',
  cultural_notes TEXT,
  difficulty_elo INTEGER NOT NULL DEFAULT 1200,
  language_id UUID NOT NULL REFERENCES public.languages(id),
  pack_id UUID REFERENCES public.scenario_packs(id),
  scenario_order INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Scenarios are publicly readable" ON public.scenarios FOR SELECT USING (true);

-- 4. Create dialogue_nodes table
CREATE TABLE public.dialogue_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id UUID NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  node_order INTEGER NOT NULL DEFAULT 0,
  intent_type TEXT NOT NULL DEFAULT 'question',
  difficulty_level TEXT NOT NULL DEFAULT 'A2',
  prompt_text TEXT NOT NULL,
  ai_context TEXT,
  possible_responses JSONB DEFAULT '[]',
  branching_paths JSONB DEFAULT '{}',
  hints JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dialogue_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dialogue nodes are publicly readable" ON public.dialogue_nodes FOR SELECT USING (true);

-- 5. Create user_scenario_progress table
CREATE TABLE public.user_scenario_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_id UUID NOT NULL REFERENCES public.scenarios(id),
  mode_unlocked TEXT NOT NULL DEFAULT 'controlled',
  controlled_completed BOOLEAN DEFAULT false,
  guided_completed BOOLEAN DEFAULT false,
  open_completed BOOLEAN DEFAULT false,
  best_score REAL DEFAULT 0,
  attempts_count INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, scenario_id)
);
ALTER TABLE public.user_scenario_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own scenario progress" ON public.user_scenario_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own scenario progress" ON public.user_scenario_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scenario progress" ON public.user_scenario_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scenario progress" ON public.user_scenario_progress FOR DELETE USING (auth.uid() = user_id);

-- 6. Create dialogue_sessions table (stores conversation history)
CREATE TABLE public.dialogue_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  scenario_id UUID NOT NULL REFERENCES public.scenarios(id),
  mode TEXT NOT NULL DEFAULT 'controlled',
  messages JSONB NOT NULL DEFAULT '[]',
  evaluation JSONB,
  skill_ratings_delta JSONB,
  score REAL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dialogue_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.dialogue_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.dialogue_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.dialogue_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.dialogue_sessions FOR DELETE USING (auth.uid() = user_id);

-- 7. Add trigger for updated_at
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scenario_packs_updated_at BEFORE UPDATE ON public.scenario_packs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_scenario_progress_updated_at BEFORE UPDATE ON public.user_scenario_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
