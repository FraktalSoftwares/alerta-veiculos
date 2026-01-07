-- Enable REPLICA IDENTITY FULL for real-time updates
ALTER TABLE public.vehicle_tracking_data REPLICA IDENTITY FULL;

-- Add table to supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicle_tracking_data;