import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapPositionRow, VehicleTrackingData, HistoricoData } from './useVehicleTracking';

/**
 * Rastreio AO VIVO via Supabase Realtime (push), no lugar do polling de 5s.
 *
 * Assina INSERTs na tabela `positions` do veículo e, a cada nova posição
 * válida, atualiza o cache do react-query:
 *  - ['vehicle-tracking', id]  -> última posição (mapa ao vivo)
 *  - ['vehicle-historico', id, ...] -> anexa o ponto às consultas de histórico abertas
 *
 * Use junto com useVehicleTracking(id), que faz a carga inicial.
 */
export function useVehiclePositionRealtime(vehicleId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!vehicleId) return;

    const channel = supabase
      .channel(`positions-${vehicleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'positions',
          filter: `vehicle_id=eq.${vehicleId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (!row || row.valid !== true) return; // ignora pontos sem fix
          const point = mapPositionRow(row);

          // 1) Atualiza a última posição (mapa ao vivo) só se for mais recente
          queryClient.setQueryData<VehicleTrackingData | null>(
            ['vehicle-tracking', vehicleId],
            (prev) => {
              if (prev?.recorded_at && point.recorded_at && prev.recorded_at > point.recorded_at) {
                return prev;
              }
              return point;
            }
          );

          // 2) Anexa o ponto às consultas de histórico abertas desse veículo
          queryClient.setQueriesData<HistoricoData[]>(
            { queryKey: ['vehicle-historico', vehicleId] },
            (prev) => {
              if (!prev) return prev;
              if (prev.some((p) => p.id === point.id)) return prev;
              return [...prev, point];
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vehicleId, queryClient]);
}
