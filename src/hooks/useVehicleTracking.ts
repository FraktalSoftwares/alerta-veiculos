import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleTrackingData {
  id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  ignition: boolean | null;
  recorded_at: string | null;
  /** Tensão da bateria do veículo (V) — hoje só Suntech/8310 (campo 27 do STT). */
  voltage: number | null;
}

/** Extrai a tensão do veículo do raw do Suntech (STT;...;<campo27=voltage>;...). */
function parseVoltage(raw: unknown): number | null {
  if (typeof raw !== 'string' || !raw.startsWith('STT;')) return null;
  const v = parseFloat(raw.split(';')[26]); // campo 27 (1-based) = índice 26
  return Number.isFinite(v) ? v : null;
}

/**
 * Mapeia uma linha da tabela `positions` para o formato usado na UI.
 * `positions` já vem decodificada e validada (lat/lng plausíveis, sem
 * heartbeats e sem o antigo "null -> 0"), independente do modelo do rastreador.
 */
export function mapPositionRow(row: any): VehicleTrackingData {
  return {
    id: row.id?.toString() ?? crypto.randomUUID(),
    vehicle_id: row.vehicle_id,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    speed: row.speed != null ? Number(row.speed) : null,
    heading: row.heading != null ? Number(row.heading) : null,
    ignition: row.ignition,
    recorded_at: row.recorded_at ?? null,
    voltage: parseVoltage(row.raw),
  };
}

export function useVehicleTracking(vehicleId: string) {
  return useQuery({
    queryKey: ['vehicle-tracking', vehicleId],
    queryFn: async (): Promise<VehicleTrackingData | null> => {
      if (!vehicleId) return null;

      // Última posição VÁLIDA do veículo (já decodificada na tabela positions)
      const { data, error } = await supabase
        .from('positions')
        .select('id, vehicle_id, latitude, longitude, speed, heading, ignition, recorded_at, raw')
        .eq('vehicle_id', vehicleId)
        .eq('valid', true)
        .order('recorded_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar última posição:', error);
        throw error;
      }
      if (!data) return null;

      return mapPositionRow(data);
    },
    enabled: !!vehicleId,
    // Sem polling: o tempo real vem do Supabase Realtime
    // (useVehiclePositionRealtime), que empurra cada nova posição na hora.
    refetchInterval: false,
  });
}

export interface HistoricoData {
  id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  ignition: boolean | null;
  recorded_at: string | null;
}

export function useVehicleTrackingHistory(
  vehicleId: string,
  startDate?: Date,
  endDate?: Date,
  limit = 1000
) {
  return useQuery({
    queryKey: ['vehicle-historico', vehicleId, startDate?.toISOString(), endDate?.toISOString(), limit],
    queryFn: async (): Promise<HistoricoData[]> => {
      if (!vehicleId) return [];

      // Histórico de posições VÁLIDAS no período (já decodificado em positions)
      let query = supabase
        .from('positions')
        .select('id, vehicle_id, latitude, longitude, speed, heading, ignition, recorded_at')
        .eq('vehicle_id', vehicleId)
        .eq('valid', true);

      if (startDate) query = query.gte('recorded_at', startDate.toISOString());
      if (endDate) query = query.lte('recorded_at', endDate.toISOString());

      const { data, error } = await query
        .order('recorded_at', { ascending: true, nullsFirst: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar histórico de posições:', error);
        throw error;
      }

      return (data || []).map(mapPositionRow);
    },
    enabled: !!vehicleId,
  });
}
