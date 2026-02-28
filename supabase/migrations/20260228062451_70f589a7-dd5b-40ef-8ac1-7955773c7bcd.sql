
-- Tighten insert policy to require authentication
DROP POLICY "Anyone can record a view" ON public.video_views;
CREATE POLICY "Authenticated users can record a view"
  ON public.video_views FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = viewer_id);
