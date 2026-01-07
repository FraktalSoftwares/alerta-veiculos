-- Insert tracking data for vehicle JRA-7766
INSERT INTO public.vehicle_tracking_data (
  vehicle_id,
  latitude,
  longitude,
  speed,
  heading,
  ignition,
  recorded_at
) VALUES (
  '60890cc4-bd66-4d04-80b8-1b4a1c6cf03e',
  -23.182807,
  -45.808299,
  45,
  180,
  true,
  now()
);