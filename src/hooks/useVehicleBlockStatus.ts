import { useQuery } from '@tanstack/react-query';
import { trackingApiClient } from '@/integrations/tracking-api/client';

interface BlockStatusResponse {
  identificador: string;
  blocked: boolean;
}

/**
 * Hook para verificar o status de bloqueio de um veículo via API
 * @param imei - IMEI do equipamento vinculado ao veículo
 */
export function useVehicleBlockStatus(imei: string | null | undefined) {
  return useQuery({
    queryKey: ['vehicle-block-status', imei],
    queryFn: async (): Promise<BlockStatusResponse> => {
      if (!imei) {
        throw new Error('IMEI é obrigatório');
      }
      return trackingApiClient.getBlockStatus(imei);
    },
    enabled: !!imei && imei !== '-',
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 2,
  });
}

/**
 * Hook para verificar o status de bloqueio de múltiplos veículos
 * @param imeis - Array de IMEIs para verificar
 */
export function useMultipleVehicleBlockStatuses(imeis: (string | null | undefined)[]) {
  return useQuery({
    queryKey: ['vehicle-block-statuses', imeis],
    queryFn: async (): Promise<Record<string, boolean>> => {
      const validImeis = imeis.filter((imei): imei is string => !!imei && imei !== '-');

      if (validImeis.length === 0) {
        return {};
      }

      const results = await Promise.all(
        validImeis.map(async (imei) => {
          try {
            const data = await trackingApiClient.getBlockStatus(imei);
            return { imei, blocked: data.blocked };
          } catch (error) {
            console.error(`Erro ao verificar bloqueio para IMEI ${imei}:`, error);
            return { imei, blocked: false };
          }
        })
      );

      return results.reduce((acc, { imei, blocked }) => {
        acc[imei] = blocked;
        return acc;
      }, {} as Record<string, boolean>);
    },
    enabled: imeis.some(imei => !!imei && imei !== '-'),
    refetchInterval: 30000,
    staleTime: 10000,
    retry: 2,
  });
}
