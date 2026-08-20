import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackingApiClient } from '@/integrations/tracking-api/client';
import { TRACKING_API_BASE_URL, TRACKING_API_ENDPOINTS } from '@/integrations/tracking-api/config';

export interface RotaObrigatoria {
  route_id: number;
  name: string;
  imei: string;
  protocol: string;
  tolerance: number;
  confirmation_radius: number;
  auto_block: boolean;
  total_distance: number;
  active: boolean;
  waypoints?: Array<{
    order: number;
    latitude: number;
    longitude: number;
    name?: string;
  }>;
}

export interface RotaStatus {
  active: boolean;
  route_id?: number;
  next_point_index?: number;
  consecutive_deviations?: number;
  tolerance?: number;
}

/**
 * Hook para listar rotas obrigatórias de um veículo
 */
export function useRotasObrigatorias(imei: string | null | undefined) {
  return useQuery<RotaObrigatoria[]>({
    queryKey: ['rotas-obrigatorias', imei],
    queryFn: () => trackingApiClient.listarRotasObrigatorias(imei || undefined),
    enabled: !!imei,
  });
}

/**
 * Hook para obter o status do monitoramento de rota
 */
export function useRotaObrigatoriaStatus(imei: string | null | undefined) {
  return useQuery<RotaStatus>({
    queryKey: ['rota-obrigatoria-status', imei],
    queryFn: () => trackingApiClient.statusRotaObrigatoria(imei!),
    enabled: !!imei,
    refetchInterval: 30000,
  });
}

export interface CriarRotaPayload {
  name: string;
  imei: string;
  protocol: string;
  points: Array<{ position: number; lat: number; lon: number; name?: string }>;
  tolerance_meters?: number;
  confirmation_radius_meters?: number;
  automatic_block?: boolean;
}

/**
 * Hook para criar uma rota obrigatória (tela nativa).
 */
export function useCriarRotaObrigatoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CriarRotaPayload) => trackingApiClient.criarRotaObrigatoria(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rotas-obrigatorias', variables.imei] });
    },
  });
}

/**
 * Hook para ativar uma rota obrigatória
 */
export function useAtivarRotaObrigatoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routeId, imei, protocol }: { routeId: number; imei: string; protocol: string }) =>
      trackingApiClient.ativarRotaObrigatoria(routeId, imei, protocol),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rotas-obrigatorias', variables.imei] });
      queryClient.invalidateQueries({ queryKey: ['rota-obrigatoria-status', variables.imei] });
    },
  });
}

/**
 * Hook para desativar uma rota obrigatória
 */
export function useDesativarRotaObrigatoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imei: string) => trackingApiClient.desativarRotaObrigatoria(imei),
    onSuccess: (_data, imei) => {
      queryClient.invalidateQueries({ queryKey: ['rotas-obrigatorias', imei] });
      queryClient.invalidateQueries({ queryKey: ['rota-obrigatoria-status', imei] });
    },
  });
}

/**
 * Hook para excluir uma rota obrigatória
 */
export function useExcluirRotaObrigatoria() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ routeId, imei }: { routeId: number; imei: string }) =>
      trackingApiClient.excluirRotaObrigatoria(routeId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rotas-obrigatorias', variables.imei] });
      queryClient.invalidateQueries({ queryKey: ['rota-obrigatoria-status', variables.imei] });
    },
  });
}

/**
 * Gera a URL para criar uma nova rota no servidor externo
 */
export function getNovaRotaUrl(imei: string, protocol: string): string {
  return `${TRACKING_API_BASE_URL}${TRACKING_API_ENDPOINTS.ROTA_OBRIGATORIA_NOVA(imei, protocol)}`;
}

/**
 * Gera a URL para visualizar uma rota no servidor externo
 */
export function getVisualizarRotaUrl(routeId: number): string {
  return `${TRACKING_API_BASE_URL}${TRACKING_API_ENDPOINTS.ROTA_OBRIGATORIA_VISUALIZAR(routeId)}`;
}
