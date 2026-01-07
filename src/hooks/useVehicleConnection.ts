import { useQuery } from '@tanstack/react-query';

interface ConnectionStatusResponse {
  status: number;
  identificador: string;
  conectado: boolean;
}

/**
 * Hook para verificar o status de conexão de um veículo via API
 * @param imei - IMEI do equipamento vinculado ao veículo
 * @param enabled - Se a query deve ser executada (default: true se imei existe)
 */
export function useVehicleConnection(imei: string | null | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['vehicle-connection', imei],
    queryFn: async (): Promise<ConnectionStatusResponse> => {
      if (!imei) {
        throw new Error('IMEI é obrigatório');
      }

      const response = await fetch(
        `https://fraktalsistemas.com.br:8004/conexoes/verificar_conexao/${imei}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao verificar conexão: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    enabled: enabled && !!imei,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    staleTime: 10000, // Considera os dados válidos por 10 segundos
    retry: 2,
  });
}

/**
 * Hook para verificar múltiplas conexões de uma vez
 * @param imeis - Array de IMEIs para verificar
 */
export function useMultipleVehicleConnections(imeis: (string | null | undefined)[]) {
  return useQuery({
    queryKey: ['vehicle-connections', imeis],
    queryFn: async (): Promise<Record<string, boolean>> => {
      const validImeis = imeis.filter((imei): imei is string => !!imei);
      
      if (validImeis.length === 0) {
        return {};
      }

      const promises = validImeis.map(async (imei) => {
        try {
          const response = await fetch(
            `https://fraktalsistemas.com.br:8004/conexoes/verificar_conexao/${imei}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) {
            return { imei, conectado: false };
          }

          const data: ConnectionStatusResponse = await response.json();
          return { imei, conectado: data.conectado };
        } catch (error) {
          console.error(`Erro ao verificar conexão para IMEI ${imei}:`, error);
          return { imei, conectado: false };
        }
      });

      const results = await Promise.all(promises);
      
      return results.reduce((acc, { imei, conectado }) => {
        acc[imei] = conectado;
        return acc;
      }, {} as Record<string, boolean>);
    },
    enabled: imeis.some(imei => !!imei),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    staleTime: 10000,
    retry: 2,
  });
}

