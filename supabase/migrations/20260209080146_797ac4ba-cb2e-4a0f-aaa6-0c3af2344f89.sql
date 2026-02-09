
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('learner', 'author', 'reviewer', 'admin');

-- 2. Create user_roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Function to get all roles for a user (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS app_role[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(array_agg(role), ARRAY[]::app_role[]) FROM public.user_roles WHERE user_id = _user_id
$$;

-- 5. RLS policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- 6. Update handle_new_user to auto-assign learner role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'learner');
  RETURN NEW;
END;
$$;

-- 7. Lessons table (authored content with exercises as JSONB)
CREATE TABLE public.lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language text NOT NULL,
    level text NOT NULL,
    title text NOT NULL,
    description text,
    tags text[] DEFAULT '{}',
    objectives text[] DEFAULT '{}',
    exercises jsonb DEFAULT '[]',
    status text NOT NULL DEFAULT 'draft',
    version text NOT NULL DEFAULT '1.0.0',
    author_id uuid NOT NULL,
    license text NOT NULL DEFAULT 'CC-BY-SA-4.0',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lessons visible to relevant users" ON public.lessons FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id OR public.has_role(auth.uid(), 'reviewer') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authors can create lessons" ON public.lessons FOR INSERT
  WITH CHECK (auth.uid() = author_id AND (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Authors and admins can update lessons" ON public.lessons FOR UPDATE
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete lessons" ON public.lessons FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Submissions table (review workflow)
CREATE TABLE public.submissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    author_id uuid NOT NULL,
    reviewer_id uuid,
    state text NOT NULL DEFAULT 'submitted',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submissions visible to relevant users" ON public.submissions FOR SELECT
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'reviewer') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authors can create submissions" ON public.submissions FOR INSERT
  WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Reviewers can update submissions" ON public.submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'reviewer') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Reviews table
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
    reviewer_id uuid NOT NULL,
    decision text NOT NULL,
    comments text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews visible to relevant users" ON public.reviews FOR SELECT
  USING (auth.uid() = reviewer_id OR public.has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND s.author_id = auth.uid()));
CREATE POLICY "Reviewers can create reviews" ON public.reviews FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'reviewer') OR public.has_role(auth.uid(), 'admin'));

-- 10. Learner progress table
CREATE TABLE public.learner_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    completion_percent integer NOT NULL DEFAULT 0,
    xp integer NOT NULL DEFAULT 0,
    streak_days integer NOT NULL DEFAULT 0,
    last_activity_at timestamptz DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, lesson_id)
);
ALTER TABLE public.learner_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.learner_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.learner_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.learner_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_learner_progress_updated_at BEFORE UPDATE ON public.learner_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Lesson attempts table
CREATE TABLE public.lesson_attempts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    exercise_id text NOT NULL,
    lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    correct boolean NOT NULL,
    time_ms integer,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts" ON public.lesson_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own attempts" ON public.lesson_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 12. Media assets table
CREATE TABLE public.media_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    path text NOT NULL,
    type text NOT NULL,
    bytes integer,
    width integer,
    height integer,
    uploaded_by uuid,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Media assets are publicly readable" ON public.media_assets FOR SELECT USING (true);
CREATE POLICY "Authors can upload media" ON public.media_assets FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'));
