
-- Classes table for 1-on-1 tutoring
CREATE TABLE public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text DEFAULT 'General',
  price numeric(10,2) NOT NULL DEFAULT 0,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes viewable by everyone" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Users can create classes" ON public.classes FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Users can update own classes" ON public.classes FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Users can delete own classes" ON public.classes FOR DELETE USING (auth.uid() = creator_id);

-- Class videos junction
CREATE TABLE public.class_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, video_id)
);

ALTER TABLE public.class_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class videos viewable by everyone" ON public.class_videos FOR SELECT USING (true);
CREATE POLICY "Class creator can manage videos" ON public.class_videos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND creator_id = auth.uid())
);
CREATE POLICY "Class creator can delete videos" ON public.class_videos FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND creator_id = auth.uid())
);

-- Enrollments table
CREATE TABLE public.class_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enrollments viewable by participant" ON public.class_enrollments FOR SELECT USING (
  auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND creator_id = auth.uid())
);
CREATE POLICY "Users can enroll" ON public.class_enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Users can unenroll" ON public.class_enrollments FOR DELETE USING (auth.uid() = student_id);

-- Trigger for updated_at on classes
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
