-- Add UPDATE RLS policy for exercise_attempts so users can update their own attempts
CREATE POLICY "Users can update their own attempts"
ON public.exercise_attempts
FOR UPDATE
USING (auth.uid() = user_id);