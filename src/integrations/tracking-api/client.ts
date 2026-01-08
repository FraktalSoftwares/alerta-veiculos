import { TRACKING_API_BASE_URL, TRACKING_API_ENDPOINTS, VehicleActionResponse, VehicleActionRequest } from './config';

/**
 * Cliente para comunicação com a API de Rastreamento
 * 
 * Parâmetros:
 * - imei: IMEI/ESN/Identificador (são a mesma coisa)
 * - protocolo: Modelo do rastreador (J16, 8310, 310)
 */
class TrackingApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = TRACKING_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Faz uma requisição para a API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `API Error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
      );
    }

    // Se a resposta não tiver conteúdo, retorna um objeto de sucesso
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { success: true } as T;
    }

    return response.json();
  }

  /**
   * Verifica o status de conexão de um veículo
   */
  async verifyConnection(imei: string): Promise<{ identificador: string; conectado: boolean; status: number }> {
    return this.request(TRACKING_API_ENDPOINTS.VERIFY_CONNECTION(imei), {
      method: 'GET',
    });
  }

  /**
   * Executa uma ação em um veículo
   */
  async executeAction(
    action: string,
    request: VehicleActionRequest
  ): Promise<VehicleActionResponse> {
    const { imei, protocolo, params } = request;
    
    // Constrói a URL com parâmetros
    let endpoint = '';
    switch (action) {
      case 'block':
        endpoint = TRACKING_API_ENDPOINTS.BLOCK_VEHICLE(imei);
        break;
      case 'unblock':
        endpoint = TRACKING_API_ENDPOINTS.UNBLOCK_VEHICLE(imei);
        break;
      case 'siren':
        endpoint = TRACKING_API_ENDPOINTS.SIREN(imei);
        break;
      case 'restart':
        endpoint = TRACKING_API_ENDPOINTS.RESTART_TRACKER(imei);
        break;
      case 'virtual_fence':
        endpoint = TRACKING_API_ENDPOINTS.VIRTUAL_FENCE(imei);
        break;
      case 'points_of_interest':
        endpoint = TRACKING_API_ENDPOINTS.POINTS_OF_INTEREST(imei);
        break;
      case 'odometer':
        endpoint = TRACKING_API_ENDPOINTS.ODOMETER(imei);
        break;
      case 'routes':
        endpoint = TRACKING_API_ENDPOINTS.ROUTES(imei);
        break;
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    // Adiciona protocolo se fornecido
    if (protocolo) {
      const separator = endpoint.includes('?') ? '&' : '?';
      endpoint += `${separator}protocolo=${encodeURIComponent(protocolo)}`;
    }

    // Adiciona parâmetros adicionais se fornecidos
    if (params && Object.keys(params).length > 0) {
      const separator = endpoint.includes('?') ? '&' : '?';
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      endpoint += `${separator}${queryParams.toString()}`;
    }

    return this.request<VehicleActionResponse>(endpoint, {
      method: 'POST',
      body: params ? JSON.stringify(params) : undefined,
    });
  }

  /**
   * Bloqueia um veículo
   * @param imei - IMEI/ESN/Identificador do equipamento
   * @param protocolo - Modelo do rastreador (J16, 8310, 310)
   */
  async blockVehicle(imei: string, protocolo?: string): Promise<VehicleActionResponse> {
    return this.executeAction('block', { imei, protocolo });
  }

  /**
   * Desbloqueia um veículo
   * @param imei - IMEI/ESN/Identificador do equipamento
   * @param protocolo - Modelo do rastreador (J16, 8310, 310)
   */
  async unblockVehicle(imei: string, protocolo?: string): Promise<VehicleActionResponse> {
    return this.executeAction('unblock', { imei, protocolo });
  }

  /**
   * Ativa a sirene do veículo
   * @param imei - IMEI/ESN/Identificador do equipamento
   * @param protocolo - Modelo do rastreador (J16, 8310, 310)
   * @param duration - Duração em segundos (opcional)
   */
  async activateSiren(imei: string, protocolo?: string, duration?: number): Promise<VehicleActionResponse> {
    return this.executeAction('siren', { 
      imei, 
      protocolo, 
      params: duration ? { duracao: duration } : undefined 
    });
  }

  /**
   * Reinicia o rastreador
   * @param imei - IMEI/ESN/Identificador do equipamento
   * @param protocolo - Modelo do rastreador (J16, 8310, 310)
   */
  async restartTracker(imei: string, protocolo?: string): Promise<VehicleActionResponse> {
    return this.executeAction('restart', { imei, protocolo });
  }

  /**
   * Gerencia cerca virtual
   * @param imei - IMEI/ESN/Identificador do equipamento
   * @param protocolo - Modelo do rastreador (J16, 8310, 310)
   * @param fenceData - Dados da cerca virtual
   */
  async manageVirtualFence(imei: string, protocolo?: string, fenceData?: any): Promise<VehicleActionResponse> {
    return this.executeAction('virtual_fence', { 
      imei, 
      protocolo, 
      params: fenceData 
    });
  }

  /**
   * Cria uma cerca virtual na API
   * @param imei - IMEI/ESN/Identificador do equipamento
   * @param protocolo - Modelo do rastreador (J16, 8310, 310)
   * @param fenceData - Dados da cerca virtual
   */
  async createVirtualFence(
    imei: string,
    protocolo: string | undefined,
    fenceData: {
      name: string;
      latitude: number;
      longitude: number;
      radius: number;
      speed_limit?: number | null;
      notify_on_enter: boolean;
      notify_on_exit: boolean;
    }
  ): Promise<VehicleActionResponse> {
    return this.manageVirtualFence(imei, protocolo, {
      action: 'create',
      ...fenceData,
    });
  }

  /**
   * Atualiza uma cerca virtual na API
   * @param imei - IMEI/ESN/Identificador do equipamento
   * @param protocolo - Modelo do rastreador (J16, 8310, 310)
   * @param fenceId - ID da cerca virtual
   * @param fenceData - Dados atualizados da cerca virtual
   */
  async updateVirtualFence(
    imei: string,
    protocolo: string | undefined,
    fenceId: string,
    fenceData: {
      name?: string;
      latitude?: number;
      longitude?: number;
      radius?: number;
      speed_limit?: number | null;
      notify_on_enter?: boolean;
      notify_on_exit?: boolean;
    }
  ): Promise<VehicleActionResponse> {
    return this.manageVirtualFence(imei, protocolo, {
      action: 'update',
      fence_id: fenceId,
      ...fenceData,
    });
  }

  /**
   * Deleta uma cerca virtual na API
   * @param imei - IMEI/ESN/Identificador do equipamento
   * @param protocolo - Modelo do rastreador (J16, 8310, 310)
   * @param fenceId - ID da cerca virtual
   */
  async deleteVirtualFence(
    imei: string,
    protocolo: string | undefined,
    fenceId: string
  ): Promise<VehicleActionResponse> {
    return this.manageVirtualFence(imei, protocolo, {
      action: 'delete',
      fence_id: fenceId,
    });
  }

  /**
   * Gerencia pontos de interesse
   * @param imei - IMEI/ESN/Identificador do equipamento
   * @param protocolo - Modelo do rastreador (J16, 8310, 310)
   * @param poiData - Dados dos pontos de interesse
   */
  async managePointsOfInterest(imei: string, protocolo?: string, poiData?: any): Promise<VehicleActionResponse> {
    return this.executeAction('points_of_interest', { 
      imei, 
      protocolo, 
      params: poiData 
    });
  }

  /**
   * Obtém dados do hodômetro
   * @param imei - IMEI/ESN/Identificador do equipamento
   * @param protocolo - Modelo do rastreador (J16, 8310, 310)
   */
  async getOdometer(imei: string, protocolo?: string): Promise<VehicleActionResponse> {
    return this.executeAction('odometer', { imei, protocolo });
  }

  /**
   * Obtém rotas do veículo
   * @param imei - IMEI/ESN/Identificador do equipamento
   * @param protocolo - Modelo do rastreador (J16, 8310, 310)
   * @param dateRange - Intervalo de datas (opcional)
   */
  async getRoutes(imei: string, protocolo?: string, dateRange?: { start: string; end: string }): Promise<VehicleActionResponse> {
    return this.executeAction('routes', { 
      imei, 
      protocolo, 
      params: dateRange 
    });
  }
}

// Instância singleton do cliente
export const trackingApiClient = new TrackingApiClient();

