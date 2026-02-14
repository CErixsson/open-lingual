
-- Add DELETE policies for user data tables

-- Profiles: users can delete their own
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Language progress
CREATE POLICY "Users can delete own language progress"
  ON public.language_progress FOR DELETE
  USING (auth.uid() = user_id);

-- User language profiles
CREATE POLICY "Users can delete own language profiles"
  ON public.user_language_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- User skill ratings
CREATE POLICY "Users can delete own skill ratings"
  ON public.user_skill_ratings FOR DELETE
  USING (user_language_profile_id IN (
    SELECT id FROM public.user_language_profiles WHERE user_id = auth.uid()
  ));

-- Exercise attempts
CREATE POLICY "Users can delete own exercise attempts"
  ON public.exercise_attempts FOR DELETE
  USING (auth.uid() = user_id);

-- Learner progress
CREATE POLICY "Users can delete own learner progress"
  ON public.learner_progress FOR DELETE
  USING (auth.uid() = user_id);

-- Lesson attempts
CREATE POLICY "Users can delete own lesson attempts"
  ON public.lesson_attempts FOR DELETE
  USING (auth.uid() = user_id);
