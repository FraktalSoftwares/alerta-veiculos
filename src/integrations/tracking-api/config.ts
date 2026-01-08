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
  
  // Ações de Veículos
  // Nota: Os endpoints abaixo devem ser ajustados conforme a documentação da API
  BLOCK_VEHICLE: (imei: string) => `/acoes/bloquear/${imei}`,
  UNBLOCK_VEHICLE: (imei: string) => `/acoes/desbloquear/${imei}`,
  SIREN: (imei: string) => `/acoes/sirene/${imei}`,
  RESTART_TRACKER: (imei: string) => `/acoes/reiniciar/${imei}`,
  VIRTUAL_FENCE: (imei: string) => `/acoes/cerca_virtual/${imei}`,
  POINTS_OF_INTEREST: (imei: string) => `/acoes/pontos_interesse/${imei}`,
  ODOMETER: (imei: string) => `/acoes/hodometro/${imei}`,
  ROUTES: (imei: string) => `/acoes/rotas/${imei}`,
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

