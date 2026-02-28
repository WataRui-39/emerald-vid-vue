
-- Create video_views table to track individual view events
CREATE TABLE public.video_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  viewer_id UUID,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (even anonymous)
CREATE POLICY "Anyone can record a view"
  ON public.video_views FOR INSERT
  WITH CHECK (true);

-- Views are readable by everyone
CREATE POLICY "Views are readable by everyone"
  ON public.video_views FOR SELECT
  USING (true);

-- Trigger to auto-increment views count on videos table
CREATE OR REPLACE FUNCTION public.increment_video_views()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.videos SET views = views + 1 WHERE id = NEW.video_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_video_view_insert
  AFTER INSERT ON public.video_views
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_video_views();
