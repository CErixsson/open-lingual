
-- Fix 1: Restrict leaderboard_entries to authenticated users
DROP POLICY IF EXISTS "Leaderboard is publicly readable" ON public.leaderboard_entries;
CREATE POLICY "Leaderboard visible to authenticated users"
  ON public.leaderboard_entries
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Fix 2: Restrict lessons SELECT to authenticated users (keeps existing role logic)
DROP POLICY IF EXISTS "Lessons visible to relevant users" ON public.lessons;
CREATE POLICY "Lessons visible to relevant users"
  ON public.lessons
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      status = 'published'
      OR auth.uid() = author_id
      OR has_role(auth.uid(), 'reviewer'::app_role)
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );
