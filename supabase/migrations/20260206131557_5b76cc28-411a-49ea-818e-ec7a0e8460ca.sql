
-- =============================================
-- PHASE 1: Elo/CEFR Rating System Schema
-- =============================================

-- 1. Languages reference table
CREATE TABLE public.languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  flag_emoji text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Languages are publicly readable" ON public.languages FOR SELECT USING (true);

-- Seed default languages
INSERT INTO public.languages (code, name, flag_emoji) VALUES
  ('sv', 'Svenska', '🇸🇪'),
  ('en', 'English', '🇬🇧'),
  ('es', 'Español', '🇪🇸'),
  ('fr', 'Français', '🇫🇷'),
  ('de', 'Deutsch', '🇩🇪'),
  ('ja', '日本語', '🇯🇵');

-- 2. Skills reference table
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  display_name text NOT NULL,
  icon_name text
);
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills are publicly readable" ON public.skills FOR SELECT USING (true);

-- Seed 6 skills
INSERT INTO public.skills (key, display_name, icon_name) VALUES
  ('listening', 'Lyssna', 'Headphones'),
  ('reading', 'Läsa', 'BookOpen'),
  ('speaking', 'Tala', 'Mic'),
  ('writing', 'Skriva', 'PenTool'),
  ('grammar', 'Grammatik', 'FileText'),
  ('vocabulary', 'Ordförråd', 'Library');

-- 3. CEFR band config (configurable per language)
CREATE TABLE public.cefr_band_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id uuid REFERENCES public.languages(id) ON DELETE CASCADE NOT NULL,
  level text NOT NULL,
  band_min integer NOT NULL,
  band_max integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(language_id, level)
);
ALTER TABLE public.cefr_band_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CEFR bands are publicly readable" ON public.cefr_band_config FOR SELECT USING (true);

-- Seed default CEFR bands for all languages
INSERT INTO public.cefr_band_config (language_id, level, band_min, band_max)
SELECT l.id, v.level, v.band_min, v.band_max
FROM public.languages l
CROSS JOIN (VALUES 
  ('A1', 800, 999),
  ('A2', 1000, 1199),
  ('B1', 1200, 1399),
  ('B2', 1400, 1599),
  ('C1', 1600, 1799),
  ('C2', 1800, 2500)
) AS v(level, band_min, band_max);

-- 4. User language profiles (per user per language)
CREATE TABLE public.user_language_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  language_id uuid REFERENCES public.languages(id) ON DELETE CASCADE NOT NULL,
  overall_elo integer NOT NULL DEFAULT 1000,
  overall_rd integer NOT NULL DEFAULT 350,
  overall_cefr text NOT NULL DEFAULT 'A2',
  streak_count integer NOT NULL DEFAULT 0,
  last_active_at timestamptz,
  total_attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, language_id)
);
ALTER TABLE public.user_language_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own language profiles" ON public.user_language_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own language profiles" ON public.user_language_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own language profiles" ON public.user_language_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Leaderboard needs to read all profiles
CREATE POLICY "Leaderboard public read" ON public.user_language_profiles
  FOR SELECT USING (true);

-- 5. User skill ratings (per skill per language profile)
CREATE TABLE public.user_skill_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_language_profile_id uuid REFERENCES public.user_language_profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  elo integer NOT NULL DEFAULT 1000,
  rd integer NOT NULL DEFAULT 350,
  attempts_count integer NOT NULL DEFAULT 0,
  last_update_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_language_profile_id, skill_id)
);
ALTER TABLE public.user_skill_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skill ratings" ON public.user_skill_ratings
  FOR SELECT USING (
    user_language_profile_id IN (
      SELECT id FROM public.user_language_profiles WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create their own skill ratings" ON public.user_skill_ratings
  FOR INSERT WITH CHECK (
    user_language_profile_id IN (
      SELECT id FROM public.user_language_profiles WHERE user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update their own skill ratings" ON public.user_skill_ratings
  FOR UPDATE USING (
    user_language_profile_id IN (
      SELECT id FROM public.user_language_profiles WHERE user_id = auth.uid()
    )
  );

-- 6. Exercises
CREATE TABLE public.exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id uuid REFERENCES public.languages(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  difficulty_elo integer NOT NULL DEFAULT 1000,
  tags text[] DEFAULT '{}',
  time_limit_sec integer,
  is_adaptive boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  content jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are publicly readable" ON public.exercises FOR SELECT USING (true);

CREATE INDEX idx_exercises_language_skill ON public.exercises(language_id, skill_id);
CREATE INDEX idx_exercises_difficulty ON public.exercises(difficulty_elo);

-- 7. Exercise attempts
CREATE TABLE public.exercise_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid REFERENCES public.exercises(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  user_language_profile_id uuid REFERENCES public.user_language_profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  score_raw real NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  time_spent_sec integer,
  elo_before integer NOT NULL,
  elo_after integer NOT NULL,
  difficulty_elo_before integer NOT NULL,
  difficulty_elo_after integer NOT NULL,
  k_factor_used integer NOT NULL,
  rd_before integer NOT NULL,
  rd_after integer NOT NULL,
  expected_score real NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exercise_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attempts" ON public.exercise_attempts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own attempts" ON public.exercise_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_attempts_user_profile ON public.exercise_attempts(user_language_profile_id);
CREATE INDEX idx_attempts_exercise ON public.exercise_attempts(exercise_id);

-- 8. Leaderboard entries (cached/materialized)
CREATE TABLE public.leaderboard_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language_id uuid REFERENCES public.languages(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
  period text NOT NULL,
  user_id uuid NOT NULL,
  display_name text,
  rating_snapshot integer NOT NULL,
  rank integer NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leaderboard is publicly readable" ON public.leaderboard_entries FOR SELECT USING (true);

CREATE INDEX idx_leaderboard_lookup ON public.leaderboard_entries(language_id, skill_id, period, rank);

-- 9. Update trigger for timestamps
CREATE TRIGGER update_user_language_profiles_updated_at
  BEFORE UPDATE ON public.user_language_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at
  BEFORE UPDATE ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Helper function: map elo to CEFR
CREATE OR REPLACE FUNCTION public.map_elo_to_cefr(p_language_id uuid, p_elo integer)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT level FROM public.cefr_band_config
  WHERE language_id = p_language_id
    AND p_elo >= band_min
    AND p_elo <= band_max
  ORDER BY band_min DESC
  LIMIT 1;
$$;

-- 11. Helper function: calculate K-factor
CREATE OR REPLACE FUNCTION public.calculate_k_factor(p_rd integer, p_attempts integer, p_elo integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_rd > 200 OR p_attempts < 20 THEN 40
    WHEN p_elo >= 1600 OR p_attempts > 100 THEN 10
    ELSE 20
  END;
$$;
