// Cliente helper para comunicação com API Asaas
// Documentação: https://docs.asaas.com/reference

export interface AsaasConfig {
  apiKey: string;
  environment: 'production' | 'sandbox';
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
  status?: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD';
  value: number;
  dueDate: string;
  status: string;
  confirmationDate?: string;
  invoiceUrl?: string;
  description?: string;
}

export class AsaasClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: AsaasConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.environment === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'access_token': this.apiKey,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.errors?.[0]?.description || 
                          result.message || 
                          `Asaas API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return result;
  }

  // ========== CUSTOMERS ==========
  async createCustomer(data: {
    name: string;
    email: string;
    phone?: string;
    cpfCnpj?: string;
    postalCode?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    city?: string;
    state?: string;
  }): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('POST', '/customers', data);
  }

  async getCustomer(customerId: string): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('GET', `/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, data: Partial<AsaasCustomer>): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('PUT', `/customers/${customerId}`, data);
  }

  async listCustomers(params?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ object: string; hasMore: boolean; totalCount: number; data: AsaasCustomer[] }> {
    const queryParams = new URLSearchParams();
    if (params?.name) queryParams.append('name', params.name);
    if (params?.email) queryParams.append('email', params.email);
    if (params?.cpfCnpj) queryParams.append('cpfCnpj', params.cpfCnpj);
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request('GET', endpoint);
  }

  // ========== SUBSCRIPTIONS ==========
  async createSubscription(data: {
    customer: string; // ID do customer
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD';
    value: number;
    nextDueDate: string; // YYYY-MM-DD
    cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
    description?: string;
    externalReference?: string;
    creditCard?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
    creditCardHolderInfo?: {
      name: string;
      email: string;
      cpfCnpj: string;
      postalCode: string;
      addressNumber: string;
      addressComplement?: string;
      phone?: string;
    };
  }): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('POST', '/subscriptions', data);
  }

  async getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('GET', `/subscriptions/${subscriptionId}`);
  }

  async updateSubscription(subscriptionId: string, data: Partial<AsaasSubscription>): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('PUT', `/subscriptions/${subscriptionId}`, data);
  }

  async cancelSubscription(subscriptionId: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>('DELETE', `/subscriptions/${subscriptionId}`);
  }

  async listSubscriptions(params?: {
    customer?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ object: string; hasMore: boolean; totalCount: number; data: AsaasSubscription[] }> {
    const queryParams = new URLSearchParams();
    if (params?.customer) queryParams.append('customer', params.customer);
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request('GET', endpoint);
  }

  // ========== PAYMENTS ==========
  async createPayment(data: {
    customer: string;
    billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD';
    value: number;
    dueDate: string; // YYYY-MM-DD
    description?: string;
    externalReference?: string;
    creditCard?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
    creditCardHolderInfo?: {
      name: string;
      email: string;
      cpfCnpj: string;
      postalCode: string;
      addressNumber: string;
      addressComplement?: string;
      phone?: string;
    };
  }): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('POST', '/payments', data);
  }

  async getPayment(paymentId: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('GET', `/payments/${paymentId}`);
  }

  async cancelPayment(paymentId: string): Promise<{ deleted: boolean }> {
    return this.request<{ deleted: boolean }>('DELETE', `/payments/${paymentId}`);
  }

  async listPayments(params?: {
    customer?: string;
    subscription?: string;
    status?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ object: string; hasMore: boolean; totalCount: number; data: AsaasPayment[] }> {
    const queryParams = new URLSearchParams();
    if (params?.customer) queryParams.append('customer', params.customer);
    if (params?.subscription) queryParams.append('subscription', params.subscription);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request('GET', endpoint);
  }
}

export function getAsaasClient(apiKey: string, environment: string): AsaasClient {
  return new AsaasClient({
    apiKey,
    environment: environment as 'production' | 'sandbox',
  });
}

