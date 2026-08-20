/**
 * Configuração da API de Rastreamento
 * Base URL: https://fraktalsistemas.com.br:8004
 * Documentação: https://fraktalsistemas.com.br:8004/docs#/
 * 
 * GLOSSÁRIO:
 * - IMEI/ESN/Identificador: São a mesma coisa - número único do equipamento
 * - Protocolo: Modelo do rastreador (J16, 8310, 310)
 */

export const TRACKING_API_BASE_URL = 'https://fraktalsistemas.com.br:8004';

/**
 * Endpoints da API de Rastreamento
 */
export const TRACKING_API_ENDPOINTS = {
  // Conexões
  VERIFY_CONNECTION: (imei: string) => `/conexoes/verificar_conexao/${imei}`,
  
  // Mapas
  MAP: (imei: string, protocolo?: string) => {
    const base = `/mapa/${encodeURIComponent(imei)}`;
    return protocolo ? `${base}?protocolo=${encodeURIComponent(protocolo)}` : base;
  },
  
  // Bloqueio — POST com body { protocolo, identificador } (protocolo minúsculo: j16 | 8310 | 310)
  BLOCK_STATUS: (imei: string) => `/bloqueio/status_bloqueio?identificador=${imei}`,
  BLOCK_VEHICLE: '/bloqueio/bloquear_veiculo',
  UNBLOCK_VEHICLE: '/bloqueio/desbloquear_veiculo',

  // Ações de Veículos
  // Nota: os endpoints abaixo ainda são placeholders — ajustar conforme a doc da API (:8004/docs)
  SIREN: (imei: string) => `/acoes/sirene/${imei}`,
  RESTART_TRACKER: (imei: string) => `/acoes/reiniciar/${imei}`,
  VIRTUAL_FENCE: (imei: string) => `/acoes/cerca_virtual/${imei}`,
  POINTS_OF_INTEREST: (imei: string) => `/acoes/pontos_interesse/${imei}`,
  ODOMETER: (imei: string) => `/acoes/hodometro/${imei}`,
  ROUTES: (imei: string) => `/acoes/rotas/${imei}`,

  // Rota Obrigatória
  ROTA_OBRIGATORIA_LISTAR: (imei?: string) =>
    imei ? `/rota_obrigatoria/listar?imei=${encodeURIComponent(imei)}` : `/rota_obrigatoria/listar`,
  ROTA_OBRIGATORIA_STATUS: (imei: string) => `/rota_obrigatoria/status/${encodeURIComponent(imei)}`,
  ROTA_OBRIGATORIA_CRIAR: `/rota_obrigatoria/criar`,
  ROTA_OBRIGATORIA_ATIVAR: `/rota_obrigatoria/ativar`,
  ROTA_OBRIGATORIA_DESATIVAR: (imei: string) => `/rota_obrigatoria/desativar?imei=${encodeURIComponent(imei)}`,
  ROTA_OBRIGATORIA_EXCLUIR: (routeId: number) => `/rota_obrigatoria/excluir/${routeId}`,
  ROTA_OBRIGATORIA_PREVIEW: (waypoints: string) =>
    `/rota_obrigatoria/api/preview?waypoints=${encodeURIComponent(waypoints)}`,
  ROTA_OBRIGATORIA_NOVA: (imei: string, protocol: string) =>
    `/rota_obrigatoria/nova?imei=${encodeURIComponent(imei)}&protocol=${encodeURIComponent(protocol)}`,
  ROTA_OBRIGATORIA_VISUALIZAR: (routeId: number) => `/rota_obrigatoria/visualizar/${routeId}`,
} as const;

/**
 * Tipos de ações disponíveis
 */
export type VehicleActionType = 
  | 'block'
  | 'unblock'
  | 'siren'
  | 'restart'
  | 'virtual_fence'
  | 'points_of_interest'
  | 'odometer'
  | 'routes';

/**
 * Interface para resposta de ações
 */
export interface VehicleActionResponse {
  success: boolean;
  message?: string;
  data?: any;
}

/**
 * Interface para requisição de ações
 */
export interface VehicleActionRequest {
  /** IMEI/ESN - Identificador único do equipamento (IMEI, ESN e Identificador são a mesma coisa) */
  imei: string;
  /** Protocolo - Modelo do rastreador (J16, 8310, 310) */
  protocolo?: string;
  params?: Record<string, any>;
}

/**
 * Modelos de rastreadores suportados (Protocolos)
 */
export type TrackerModel = 'J16' | '8310' | '310' | 'j16' | '8310' | '310';

