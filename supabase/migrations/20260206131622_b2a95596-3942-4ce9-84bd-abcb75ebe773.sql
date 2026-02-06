
-- Fix search_path for calculate_k_factor
CREATE OR REPLACE FUNCTION public.calculate_k_factor(p_rd integer, p_attempts integer, p_elo integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_rd > 200 OR p_attempts < 20 THEN 40
    WHEN p_elo >= 1600 OR p_attempts > 100 THEN 10
    ELSE 20
  END;
$$;

-- Remove overly permissive public read on user_language_profiles
-- We have leaderboard_entries for public display
DROP POLICY IF EXISTS "Leaderboard public read" ON public.user_language_profiles;
