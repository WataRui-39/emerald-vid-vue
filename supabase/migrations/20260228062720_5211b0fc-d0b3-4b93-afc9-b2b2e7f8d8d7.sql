
-- Create a view that counts subscribers per channel
CREATE VIEW public.channel_fan_counts
WITH (security_invoker=on) AS
  SELECT channel_id, COUNT(*) AS fan_count
  FROM public.subscriptions
  GROUP BY channel_id;
