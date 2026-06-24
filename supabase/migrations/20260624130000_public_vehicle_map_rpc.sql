-- =============================================
-- RPC público para o mapa compartilhado (/compartilhar/:id)
--
-- O link público é acessado SEM login (anon). Em vez de abrir `vehicles`/
-- `positions` inteiras para anon (RLS), expomos só os dados de UM veículo,
-- buscados pelo seu id (que é o "token" do link de compartilhamento), via
-- função SECURITY DEFINER. Retorna info do veículo + última posição válida.
-- =============================================

CREATE OR REPLACE FUNCTION public.get_public_vehicle_map(p_vehicle_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', v.id,
    'plate', v.plate,
    'brand', v.brand,
    'model', v.model,
    'vehicle_type', v.vehicle_type,
    'status', v.status,
    'client_name', c.name,
    'imei', e.imei,
    'chip_number', e.chip_number,
    'position', (
      SELECT jsonb_build_object(
        'latitude', p.latitude,
        'longitude', p.longitude,
        'speed', p.speed,
        'heading', p.heading,
        'ignition', p.ignition,
        'recorded_at', p.recorded_at
      )
      FROM public.positions p
      WHERE p.vehicle_id = v.id AND p.valid = true
      ORDER BY p.recorded_at DESC NULLS LAST
      LIMIT 1
    )
  )
  FROM public.vehicles v
  LEFT JOIN public.clients c ON c.id = v.client_id
  LEFT JOIN public.equipment e ON e.vehicle_id = v.id
  WHERE v.id = p_vehicle_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_vehicle_map(UUID) TO anon, authenticated;
