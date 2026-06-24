import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PublicVehicleMap {
  id: string;
  plate: string | null;
  brand: string | null;
  model: string | null;
  vehicle_type: string | null;
  status: string | null;
  client_name: string | null;
  imei: string | null;
  chip_number: string | null;
  position: {
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
    ignition: boolean | null;
    recorded_at: string | null;
  } | null;
}

/**
 * Dados do veículo + última posição para o mapa PÚBLICO (sem login).
 * Usa a RPC SECURITY DEFINER get_public_vehicle_map (acesso anon por id).
 */
export function usePublicVehicleMap(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['public-vehicle-map', vehicleId],
    queryFn: async (): Promise<PublicVehicleMap | null> => {
      if (!vehicleId) return null;
      const { data, error } = await (supabase as any).rpc('get_public_vehicle_map', {
        p_vehicle_id: vehicleId,
      });
      if (error) throw error;
      return (data as PublicVehicleMap) ?? null;
    },
    enabled: !!vehicleId,
    refetchInterval: 10000, // público: atualiza a cada 10s (sem realtime p/ anon)
  });
}
