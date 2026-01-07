-- Create historico table for vehicle tracking history
CREATE TABLE public.historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  speed NUMERIC DEFAULT 0,
  heading INTEGER DEFAULT 0,
  ignition BOOLEAN DEFAULT false,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;

-- Admins can view all history
CREATE POLICY "Admins can view all historico"
ON public.historico
FOR SELECT
USING (is_admin(auth.uid()));

-- System can insert tracking data
CREATE POLICY "System can insert historico"
ON public.historico
FOR INSERT
WITH CHECK (true);

-- Users can view history of own vehicles
CREATE POLICY "Users can view historico of own vehicles"
ON public.historico
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vehicles v
    JOIN clients c ON c.id = v.client_id
    WHERE v.id = historico.vehicle_id AND c.owner_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_historico_vehicle_id ON public.historico(vehicle_id);
CREATE INDEX idx_historico_recorded_at ON public.historico(recorded_at DESC);

-- Insert sample tracking data for the vehicle
INSERT INTO public.historico (vehicle_id, latitude, longitude, speed, heading, ignition, recorded_at)
VALUES
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.19263, -45.83640, 0, 0, true, NOW() - INTERVAL '2 hours'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.19350, -45.83550, 25, 45, true, NOW() - INTERVAL '1 hour 55 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.19450, -45.83450, 40, 60, true, NOW() - INTERVAL '1 hour 50 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.19550, -45.83350, 55, 75, true, NOW() - INTERVAL '1 hour 45 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.19650, -45.83250, 60, 90, true, NOW() - INTERVAL '1 hour 40 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.19750, -45.83150, 45, 100, true, NOW() - INTERVAL '1 hour 35 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.19850, -45.83050, 30, 110, true, NOW() - INTERVAL '1 hour 30 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.19950, -45.82950, 50, 120, true, NOW() - INTERVAL '1 hour 25 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.20050, -45.82850, 65, 135, true, NOW() - INTERVAL '1 hour 20 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.20150, -45.82750, 70, 150, true, NOW() - INTERVAL '1 hour 15 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.20250, -45.82650, 55, 165, true, NOW() - INTERVAL '1 hour 10 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.20350, -45.82550, 40, 180, true, NOW() - INTERVAL '1 hour 5 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.20450, -45.82450, 25, 195, true, NOW() - INTERVAL '1 hour'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.20550, -45.82350, 35, 210, true, NOW() - INTERVAL '55 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.20650, -45.82250, 50, 225, true, NOW() - INTERVAL '50 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.20750, -45.82150, 60, 240, true, NOW() - INTERVAL '45 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.20850, -45.82050, 45, 255, true, NOW() - INTERVAL '40 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.20950, -45.81950, 30, 270, true, NOW() - INTERVAL '35 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.21050, -45.81850, 20, 285, true, NOW() - INTERVAL '30 minutes'),
  ('60890cc4-bd66-4d04-80b8-1b4a1c6cf03e', -23.21150, -45.81750, 0, 300, false, NOW() - INTERVAL '25 minutes');