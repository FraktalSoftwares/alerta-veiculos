-- =============================================
-- RLS: Permitir motoristas verem seus próprios dados
-- O motorista tem user_id na tabela clients, mas as
-- políticas existentes só checam owner_id (admin que criou).
-- =============================================

-- CLIENTS: motorista pode ver seu próprio registro de cliente
CREATE POLICY "Motoristas can view own client record"
ON public.clients
FOR SELECT
USING (user_id = auth.uid());

-- VEHICLES: motorista pode ver veículos do seu cliente vinculado
CREATE POLICY "Motoristas can view own vehicles"
ON public.vehicles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = vehicles.client_id
    AND clients.user_id = auth.uid()
  )
);

-- EQUIPMENT: motorista pode ver equipamentos dos seus veículos
-- (necessário para o JOIN em useVehicles que carrega imei/operadora)
CREATE POLICY "Motoristas can view equipment of own vehicles"
ON public.equipment
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.clients c ON c.id = v.client_id
    WHERE v.id = equipment.vehicle_id
    AND c.user_id = auth.uid()
  )
);

-- VEHICLE_TRACKING_DATA: motorista pode ver histórico dos seus veículos
CREATE POLICY "Motoristas can view tracking of own vehicles"
ON public.vehicle_tracking_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.clients c ON c.id = v.client_id
    WHERE v.id = vehicle_tracking_data.vehicle_id
    AND c.user_id = auth.uid()
  )
);

-- VEHICLE_ALERTS: motorista pode ver alertas dos seus veículos
CREATE POLICY "Motoristas can view alerts of own vehicles"
ON public.vehicle_alerts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.clients c ON c.id = v.client_id
    WHERE v.id = vehicle_alerts.vehicle_id
    AND c.user_id = auth.uid()
  )
);

-- HISTORICO: motorista pode ver histórico dos seus veículos
CREATE POLICY "Motoristas can view historico of own vehicles"
ON public.historico
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.clients c ON c.id = v.client_id
    WHERE v.id = historico.vehicle_id
    AND c.user_id = auth.uid()
  )
);
