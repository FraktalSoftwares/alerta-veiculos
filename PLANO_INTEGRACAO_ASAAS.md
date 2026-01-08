# Plano Completo: Integração Asaas para Assinaturas

## 📋 Visão Geral

Este documento detalha o plano completo para integrar o **Asaas** como gateway de pagamento para o sistema de assinaturas, tornando-o 100% funcional.

---

## 🎯 OBJETIVOS

1. Integrar Asaas como gateway de pagamento
2. Implementar assinaturas recorrentes (mensais, trimestrais, anuais)
3. Processar pagamentos automáticos
4. Gerenciar webhooks do Asaas
5. Tratar falhas e retentativas
6. Sincronizar dados entre sistema e Asaas

---

## 📚 PARTE 1: CONHECIMENTO DO ASAAS

### 1.1 O que é o Asaas

O **Asaas** é uma plataforma brasileira de pagamentos que oferece:
- ✅ Cobranças recorrentes (assinaturas)
- ✅ Cartão de crédito
- ✅ PIX
- ✅ Boleto bancário
- ✅ Débito em conta
- ✅ Webhooks para eventos
- ✅ API REST completa

### 1.2 Recursos do Asaas que vamos usar

1. **Assinaturas (Subscriptions)**
   - Criar assinatura
   - Atualizar assinatura
   - Cancelar assinatura
   - Listar assinaturas

2. **Cobranças (Payments)**
   - Criar cobrança
   - Consultar status
   - Cancelar cobrança
   - Receber webhooks

3. **Clientes (Customers)**
   - Criar cliente no Asaas
   - Atualizar cliente
   - Buscar cliente

4. **Webhooks**
   - Pagamento confirmado
   - Pagamento recusado
   - Assinatura cancelada
   - Etc.

### 1.3 Documentação Asaas

- **API**: https://docs.asaas.com/reference
- **Webhooks**: https://docs.asaas.com/docs/webhooks
- **Assinaturas**: https://docs.asaas.com/docs/assinaturas

---

## 🗄️ PARTE 2: ESTRUTURA DE BANCO DE DADOS

### 2.1 Migration Completa

```sql
-- =============================================
-- INTEGRAÇÃO ASAAS - ASSINATURAS
-- =============================================

-- Enums necessários
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired', 'trial');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'refunded', 'failed');
CREATE TYPE subscription_billing_cycle AS ENUM ('monthly', 'quarterly', 'annual', 'custom');
CREATE TYPE payment_method_type AS ENUM ('credit_card', 'debit_card', 'pix', 'boleto', 'bank_slip');

-- =============================================
-- TABELA: subscriptions
-- =============================================
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relacionamentos
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) NOT NULL,
    product_id UUID REFERENCES public.products(id), -- Produto/serviço (opcional)
    
    -- IDs do Asaas (sincronização)
    asaas_customer_id TEXT, -- ID do cliente no Asaas
    asaas_subscription_id TEXT UNIQUE, -- ID da assinatura no Asaas
    
    -- Dados da assinatura
    subscription_type subscription_billing_cycle NOT NULL DEFAULT 'monthly',
    amount DECIMAL(10, 2) NOT NULL,
    billing_cycle INTEGER DEFAULT 1, -- 1=mensal, 3=trimestral, 12=anual
    billing_day INTEGER CHECK (billing_day >= 1 AND billing_day <= 31), -- Dia do mês
    
    -- Status e datas
    status subscription_status DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE, -- NULL = sem data de fim
    trial_end_date DATE, -- Data fim do trial (se houver)
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Configurações
    auto_renew BOOLEAN DEFAULT true,
    payment_method payment_method_type DEFAULT 'credit_card',
    
    -- Dados do cartão (criptografados ou apenas últimos 4 dígitos)
    card_last_four TEXT,
    card_brand TEXT, -- visa, mastercard, etc
    card_holder_name TEXT,
    
    -- Metadados
    description TEXT,
    notes TEXT,
    metadata JSONB, -- Dados extras em JSON
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ, -- Última sincronização com Asaas
    deleted_at TIMESTAMPTZ -- Soft delete
);

-- Índices
CREATE INDEX idx_subscriptions_client ON public.subscriptions(client_id);
CREATE INDEX idx_subscriptions_owner ON public.subscriptions(owner_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_asaas_id ON public.subscriptions(asaas_subscription_id);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX idx_subscriptions_created_at ON public.subscriptions(created_at DESC);

-- =============================================
-- TABELA: subscription_items
-- =============================================
CREATE TABLE public.subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id),
    vehicle_id UUID REFERENCES public.vehicles(id),
    
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_items_subscription ON public.subscription_items(subscription_id);

-- =============================================
-- TABELA: subscription_payments
-- =============================================
CREATE TABLE public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    
    -- ID do Asaas
    asaas_payment_id TEXT UNIQUE, -- ID do pagamento no Asaas
    
    -- Dados do pagamento
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status payment_status DEFAULT 'pending',
    
    -- Período cobrado
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    
    -- Referências
    invoice_number TEXT,
    invoice_url TEXT, -- URL do boleto/fatura
    
    -- Gateway
    payment_method payment_method_type,
    payment_gateway TEXT DEFAULT 'asaas',
    
    -- Retentativas
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_date DATE,
    
    -- Falhas
    failure_reason TEXT,
    failure_code TEXT, -- Código de erro do Asaas
    
    -- Metadados
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_payments_subscription ON public.subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_status ON public.subscription_payments(status);
CREATE INDEX idx_subscription_payments_due_date ON public.subscription_payments(due_date);
CREATE INDEX idx_subscription_payments_asaas_id ON public.subscription_payments(asaas_payment_id);
CREATE INDEX idx_subscription_payments_next_retry ON public.subscription_payments(next_retry_date) WHERE status = 'failed';

-- =============================================
-- TABELA: subscription_history
-- =============================================
CREATE TABLE public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    
    event_type TEXT NOT NULL, -- created, activated, paused, resumed, cancelled, renewed, payment_failed, payment_succeeded, plan_changed, etc
    description TEXT,
    
    old_value JSONB,
    new_value JSONB,
    
    user_id UUID REFERENCES public.profiles(id),
    asaas_event_id TEXT, -- ID do evento no Asaas (se veio de webhook)
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscription_history_subscription ON public.subscription_history(subscription_id);
CREATE INDEX idx_subscription_history_event_type ON public.subscription_history(event_type);
CREATE INDEX idx_subscription_history_created_at ON public.subscription_history(created_at DESC);

-- =============================================
-- TABELA: asaas_configuration
-- =============================================
CREATE TABLE public.asaas_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) NOT NULL, -- Quem gerencia
    
    -- Credenciais (armazenadas criptografadas)
    api_key TEXT NOT NULL, -- API Key do Asaas
    environment TEXT NOT NULL DEFAULT 'production', -- production, sandbox
    
    -- Configurações
    default_payment_method payment_method_type DEFAULT 'credit_card',
    auto_retry_failed_payments BOOLEAN DEFAULT true,
    max_retry_attempts INTEGER DEFAULT 3,
    retry_interval_days INTEGER DEFAULT 3,
    
    -- Webhook
    webhook_url TEXT, -- URL do webhook configurada no Asaas
    webhook_secret TEXT, -- Secret para validar webhooks
    
    -- Metadados
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asaas_config_owner ON public.asaas_configuration(owner_id);
CREATE INDEX idx_asaas_config_active ON public.asaas_configuration(is_active);

-- =============================================
-- TABELA: asaas_webhook_events
-- =============================================
CREATE TABLE public.asaas_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Dados do webhook
    event_type TEXT NOT NULL, -- PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, etc
    asaas_event_id TEXT UNIQUE, -- ID do evento no Asaas
    
    -- Relacionamentos
    subscription_id UUID REFERENCES public.subscriptions(id),
    payment_id UUID REFERENCES public.subscription_payments(id),
    
    -- Payload completo
    payload JSONB NOT NULL,
    
    -- Status de processamento
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_asaas_webhook_events_type ON public.asaas_webhook_events(event_type);
CREATE INDEX idx_asaas_webhook_events_processed ON public.asaas_webhook_events(processed);
CREATE INDEX idx_asaas_webhook_events_asaas_id ON public.asaas_webhook_events(asaas_event_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger para updated_at
CREATE TRIGGER update_subscriptions_updated_at 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_payments_updated_at 
    BEFORE UPDATE ON public.subscription_payments 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_asaas_config_updated_at 
    BEFORE UPDATE ON public.asaas_configuration 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS POLICIES
-- =============================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

-- Subscriptions
CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Users can create subscriptions for own clients" 
ON public.subscriptions FOR INSERT 
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" 
ON public.subscriptions FOR UPDATE 
USING (owner_id = auth.uid());

CREATE POLICY "Admins can manage all subscriptions" 
ON public.subscriptions FOR ALL 
USING (public.is_admin(auth.uid()));

-- Subscription Items
CREATE POLICY "Users can manage items of own subscriptions" 
ON public.subscription_items FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE subscriptions.id = subscription_items.subscription_id 
    AND subscriptions.owner_id = auth.uid()
));

-- Subscription Payments
CREATE POLICY "Users can view payments of own subscriptions" 
ON public.subscription_payments FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE subscriptions.id = subscription_payments.subscription_id 
    AND subscriptions.owner_id = auth.uid()
));

CREATE POLICY "System can insert payments" 
ON public.subscription_payments FOR INSERT 
WITH CHECK (true); -- Edge Functions precisam inserir

CREATE POLICY "System can update payments" 
ON public.subscription_payments FOR UPDATE 
USING (true); -- Edge Functions precisam atualizar

-- Subscription History
CREATE POLICY "Users can view history of own subscriptions" 
ON public.subscription_history FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE subscriptions.id = subscription_history.subscription_id 
    AND subscriptions.owner_id = auth.uid()
));

CREATE POLICY "System can insert history" 
ON public.subscription_history FOR INSERT 
WITH CHECK (true);

-- Asaas Configuration
CREATE POLICY "Users can view own config" 
ON public.asaas_configuration FOR SELECT 
USING (owner_id = auth.uid());

CREATE POLICY "Admins can manage all configs" 
ON public.asaas_configuration FOR ALL 
USING (public.is_admin(auth.uid()));

-- Webhook Events (apenas leitura para usuários, sistema pode inserir)
CREATE POLICY "Users can view webhook events" 
ON public.asaas_webhook_events FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.subscriptions 
        WHERE subscriptions.id = asaas_webhook_events.subscription_id 
        AND subscriptions.owner_id = auth.uid()
    ) OR auth.uid() IS NULL -- Para webhooks
);

CREATE POLICY "System can insert webhook events" 
ON public.asaas_webhook_events FOR INSERT 
WITH CHECK (true);
```

### 2.2 Funções Auxiliares SQL

```sql
-- Função para obter configuração ativa do Asaas
CREATE OR REPLACE FUNCTION public.get_asaas_config(_owner_id UUID)
RETURNS TABLE (
    id UUID,
    api_key TEXT,
    environment TEXT,
    default_payment_method payment_method_type,
    auto_retry_failed_payments BOOLEAN,
    max_retry_attempts INTEGER,
    retry_interval_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.id,
        ac.api_key,
        ac.environment,
        ac.default_payment_method,
        ac.auto_retry_failed_payments,
        ac.max_retry_attempts,
        ac.retry_interval_days
    FROM public.asaas_configuration ac
    WHERE ac.owner_id = _owner_id
    AND ac.is_active = true
    ORDER BY ac.created_at DESC
    LIMIT 1;
END;
$$;

-- Função para buscar assinatura por ID do Asaas
CREATE OR REPLACE FUNCTION public.get_subscription_by_asaas_id(_asaas_id TEXT)
RETURNS TABLE (
    id UUID,
    client_id UUID,
    owner_id UUID,
    status subscription_status,
    amount DECIMAL,
    asaas_subscription_id TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.client_id,
        s.owner_id,
        s.status,
        s.amount,
        s.asaas_subscription_id
    FROM public.subscriptions s
    WHERE s.asaas_subscription_id = _asaas_id
    AND s.deleted_at IS NULL;
END;
$$;
```

---

## 🔧 PARTE 3: CONFIGURAÇÃO DO ASAAS

### 3.1 Criar Conta no Asaas

1. Acessar https://www.asaas.com
2. Criar conta (empresarial)
3. Completar cadastro e verificação
4. Acessar painel administrativo

### 3.2 Obter API Key

1. No painel: **Integrações** → **API**
2. Copiar **API Key** (produção ou sandbox)
3. Guardar em local seguro (será usado nas Edge Functions)

### 3.3 Configurar Webhook

1. No painel: **Integrações** → **Webhooks**
2. Adicionar URL: `https://[seu-projeto].supabase.co/functions/v1/asaas-webhook`
3. Selecionar eventos:
   - `PAYMENT_CONFIRMED` - Pagamento confirmado
   - `PAYMENT_RECEIVED` - Pagamento recebido
   - `PAYMENT_OVERDUE` - Pagamento vencido
   - `PAYMENT_REFUNDED` - Pagamento reembolsado
   - `SUBSCRIPTION_CANCELLED` - Assinatura cancelada
   - `SUBSCRIPTION_UPDATED` - Assinatura atualizada

### 3.4 Variáveis de Ambiente

Adicionar no Supabase Dashboard:
- `ASAAS_API_KEY` - API Key do Asaas
- `ASAAS_ENVIRONMENT` - `production` ou `sandbox`
- `ASAAS_WEBHOOK_SECRET` - Secret para validar webhooks (opcional)

---

## 💻 PARTE 4: EDGE FUNCTIONS

### 4.1 Estrutura de Pastas

```
supabase/functions/
├── asaas-client/          # Cliente helper para API Asaas
│   └── index.ts
├── create-subscription/   # Criar assinatura
│   └── index.ts
├── update-subscription/   # Atualizar assinatura
│   └── index.ts
├── cancel-subscription/   # Cancelar assinatura
│   └── index.ts
├── create-payment/        # Criar pagamento único
│   └── index.ts
├── asaas-webhook/         # Receber webhooks do Asaas
│   └── index.ts
├── sync-subscription/     # Sincronizar assinatura com Asaas
│   └── index.ts
└── process-due-payments/  # Processar pagamentos vencidos (cron)
    └── index.ts
```

### 4.2 Cliente Asaas (Helper)

**`supabase/functions/asaas-client/index.ts`**

```typescript
// Cliente helper para comunicação com API Asaas
export interface AsaasConfig {
  apiKey: string;
  environment: 'production' | 'sandbox';
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
      throw new Error(
        result.errors?.[0]?.description || 
        `Asaas API error: ${response.status}`
      );
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
  }) {
    return this.request<any>('POST', '/customers', data);
  }

  async getCustomer(customerId: string) {
    return this.request<any>('GET', `/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, data: any) {
    return this.request<any>('PUT', `/customers/${customerId}`, data);
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
  }) {
    return this.request<any>('POST', '/subscriptions', data);
  }

  async getSubscription(subscriptionId: string) {
    return this.request<any>('GET', `/subscriptions/${subscriptionId}`);
  }

  async updateSubscription(subscriptionId: string, data: any) {
    return this.request<any>('PUT', `/subscriptions/${subscriptionId}`, data);
  }

  async cancelSubscription(subscriptionId: string) {
    return this.request<any>('DELETE', `/subscriptions/${subscriptionId}`);
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
  }) {
    return this.request<any>('POST', '/payments', data);
  }

  async getPayment(paymentId: string) {
    return this.request<any>('GET', `/payments/${paymentId}`);
  }

  async cancelPayment(paymentId: string) {
    return this.request<any>('DELETE', `/payments/${paymentId}`);
  }
}

export function getAsaasClient(apiKey: string, environment: string): AsaasClient {
  return new AsaasClient({
    apiKey,
    environment: environment as 'production' | 'sandbox',
  });
}
```

### 4.3 Criar Assinatura

**`supabase/functions/create-subscription/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';
import { getAsaasClient } from '../asaas-client/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  clientId: string;
  productId?: string;
  subscriptionType: 'monthly' | 'quarterly' | 'annual';
  amount: number;
  billingDay: number; // 1-31
  paymentMethod: 'credit_card' | 'pix' | 'boleto';
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  description?: string;
  startDate?: string; // YYYY-MM-DD
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: CreateSubscriptionRequest = await req.json();

    // 1. Buscar cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*, profiles!clients_owner_id_fkey(*)')
      .eq('id', body.clientId)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar configuração do Asaas
    const { data: asaasConfig, error: configError } = await supabase
      .from('asaas_configuration')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (configError || !asaasConfig) {
      return new Response(
        JSON.stringify({ error: 'Configuração do Asaas não encontrada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const asaasClient = getAsaasClient(asaasConfig.api_key, asaasConfig.environment);

    // 3. Criar ou buscar customer no Asaas
    let asaasCustomerId = client.asaas_customer_id;
    
    if (!asaasCustomerId) {
      const customerData = {
        name: client.name,
        email: client.email || client.profiles.email,
        phone: client.phone,
        cpfCnpj: client.document_number,
      };

      const asaasCustomer = await asaasClient.createCustomer(customerData);
      asaasCustomerId = asaasCustomer.id;

      // Atualizar cliente com ID do Asaas
      await supabase
        .from('clients')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('id', client.id);
    }

    // 4. Mapear billing cycle
    const cycleMap = {
      monthly: 'MONTHLY',
      quarterly: 'QUARTERLY',
      annual: 'YEARLY',
    };

    const billingTypeMap = {
      credit_card: 'CREDIT_CARD',
      pix: 'PIX',
      boleto: 'BOLETO',
    };

    // 5. Calcular próxima data de vencimento
    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const nextDueDate = new Date(startDate);
    nextDueDate.setDate(body.billingDay);

    if (nextDueDate < startDate) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    // 6. Criar assinatura no Asaas
    const subscriptionData: any = {
      customer: asaasCustomerId,
      billingType: billingTypeMap[body.paymentMethod],
      value: body.amount,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      cycle: cycleMap[body.subscriptionType],
      description: body.description || `Assinatura - ${client.name}`,
      externalReference: `sub_${Date.now()}`,
    };

    if (body.paymentMethod === 'credit_card' && body.creditCard) {
      subscriptionData.creditCard = {
        holderName: body.creditCard.holderName,
        number: body.creditCard.number.replace(/\s/g, ''),
        expiryMonth: body.creditCard.expiryMonth,
        expiryYear: body.creditCard.expiryYear,
        ccv: body.creditCard.cvv,
      };
    }

    const asaasSubscription = await asaasClient.createSubscription(subscriptionData);

    // 7. Criar assinatura no banco
    const cycleMonths = {
      monthly: 1,
      quarterly: 3,
      annual: 12,
    };

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        client_id: body.clientId,
        owner_id: user.id,
        product_id: body.productId || null,
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: asaasSubscription.id,
        subscription_type: body.subscriptionType,
        amount: body.amount,
        billing_cycle: cycleMonths[body.subscriptionType],
        billing_day: body.billingDay,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        payment_method: body.paymentMethod,
        card_last_four: body.creditCard?.number.slice(-4) || null,
        description: body.description,
        auto_renew: true,
        synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError) {
      // Rollback: cancelar assinatura no Asaas
      await asaasClient.cancelSubscription(asaasSubscription.id);
      throw subError;
    }

    // 8. Criar histórico
    await supabase.from('subscription_history').insert({
      subscription_id: subscription.id,
      event_type: 'created',
      description: 'Assinatura criada',
      new_value: subscription,
      user_id: user.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          asaas_subscription_id: asaasSubscription.id,
          status: subscription.status,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create subscription error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao criar assinatura' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 4.4 Webhook Handler

**`supabase/functions/asaas-webhook/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const event = payload.event; // PAYMENT_CONFIRMED, PAYMENT_RECEIVED, etc
    const payment = payload.payment;

    console.log('Asaas webhook received:', event, payment?.id);

    // 1. Salvar evento
    const { data: webhookEvent, error: webhookError } = await supabase
      .from('asaas_webhook_events')
      .insert({
        event_type: event,
        asaas_event_id: payment?.id || payload.id,
        payload: payload,
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      console.error('Error saving webhook event:', webhookError);
    }

    // 2. Processar evento
    let processed = false;
    let errorMessage: string | null = null;

    try {
      switch (event) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
          processed = await handlePaymentConfirmed(supabase, payment);
          break;
        
        case 'PAYMENT_OVERDUE':
          processed = await handlePaymentOverdue(supabase, payment);
          break;
        
        case 'PAYMENT_REFUNDED':
          processed = await handlePaymentRefunded(supabase, payment);
          break;
        
        case 'SUBSCRIPTION_CANCELLED':
          processed = await handleSubscriptionCancelled(supabase, payload.subscription);
          break;
        
        case 'SUBSCRIPTION_UPDATED':
          processed = await handleSubscriptionUpdated(supabase, payload.subscription);
          break;
        
        default:
          console.log('Unhandled event type:', event);
          processed = true; // Marcar como processado mesmo sem ação
      }
    } catch (error) {
      errorMessage = error.message;
      console.error('Error processing webhook:', error);
    }

    // 3. Atualizar evento
    if (webhookEvent) {
      await supabase
        .from('asaas_webhook_events')
        .update({
          processed,
          processed_at: processed ? new Date().toISOString() : null,
          error_message: errorMessage,
        })
        .eq('id', webhookEvent.id);
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handlers
async function handlePaymentConfirmed(supabase: any, payment: any) {
  // Buscar pagamento por ID do Asaas
  const { data: subscriptionPayment, error } = await supabase
    .from('subscription_payments')
    .select('*, subscriptions(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  if (error || !subscriptionPayment) {
    console.error('Payment not found:', payment.id);
    return false;
  }

  // Atualizar pagamento
  await supabase
    .from('subscription_payments')
    .update({
      status: 'paid',
      paid_date: payment.confirmationDate || new Date().toISOString().split('T')[0],
      invoice_url: payment.invoiceUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionPayment.id);

  // Criar registro financeiro
  await supabase.from('finance_records').insert({
    owner_id: subscriptionPayment.subscriptions.owner_id,
    client_id: subscriptionPayment.subscriptions.client_id,
    type: 'revenue',
    amount: payment.value,
    description: `Pagamento assinatura - ${payment.description || ''}`,
    payment_date: payment.confirmationDate || new Date().toISOString().split('T')[0],
    status: 'paid',
    payment_method: mapPaymentMethod(payment.billingType),
    reference_month: new Date().toISOString().split('T')[0],
  });

  // Criar histórico
  await supabase.from('subscription_history').insert({
    subscription_id: subscriptionPayment.subscription_id,
    event_type: 'payment_succeeded',
    description: `Pagamento confirmado: R$ ${payment.value}`,
    asaas_event_id: payment.id,
  });

  return true;
}

async function handlePaymentOverdue(supabase: any, payment: any) {
  const { data: subscriptionPayment } = await supabase
    .from('subscription_payments')
    .select('*, subscriptions(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  if (!subscriptionPayment) return false;

  await supabase
    .from('subscription_payments')
    .update({
      status: 'overdue',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionPayment.id);

  await supabase.from('subscription_history').insert({
    subscription_id: subscriptionPayment.subscription_id,
    event_type: 'payment_overdue',
    description: `Pagamento vencido: R$ ${payment.value}`,
    asaas_event_id: payment.id,
  });

  return true;
}

async function handlePaymentRefunded(supabase: any, payment: any) {
  const { data: subscriptionPayment } = await supabase
    .from('subscription_payments')
    .select('*, subscriptions(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  if (!subscriptionPayment) return false;

  await supabase
    .from('subscription_payments')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionPayment.id);

  return true;
}

async function handleSubscriptionCancelled(supabase: any, subscription: any) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('asaas_subscription_id', subscription.id)
    .single();

  if (!sub) return false;

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id);

  await supabase.from('subscription_history').insert({
    subscription_id: sub.id,
    event_type: 'cancelled',
    description: 'Assinatura cancelada via Asaas',
    asaas_event_id: subscription.id,
  });

  return true;
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('asaas_subscription_id', subscription.id)
    .single();

  if (!sub) return false;

  await supabase
    .from('subscriptions')
    .update({
      amount: subscription.value,
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id);

  return true;
}

function mapPaymentMethod(billingType: string): string {
  const map: Record<string, string> = {
    'CREDIT_CARD': 'credit_card',
    'DEBIT_CARD': 'debit_card',
    'PIX': 'pix',
    'BOLETO': 'boleto',
  };
  return map[billingType] || 'credit_card';
}
```

### 4.5 Cancelar Assinatura

**`supabase/functions/cancel-subscription/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';
import { getAsaasClient } from '../asaas-client/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { subscriptionId, reason } = await req.json();

    // Buscar assinatura
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*, asaas_configuration!inner(*)')
      .eq('id', subscriptionId)
      .eq('owner_id', user.id)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Assinatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cancelar no Asaas
    if (subscription.asaas_subscription_id) {
      const asaasClient = getAsaasClient(
        subscription.asaas_configuration.api_key,
        subscription.asaas_configuration.environment
      );
      
      try {
        await asaasClient.cancelSubscription(subscription.asaas_subscription_id);
      } catch (error) {
        console.error('Error cancelling in Asaas:', error);
        // Continuar mesmo se falhar no Asaas
      }
    }

    // Atualizar no banco
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    // Criar histórico
    await supabase.from('subscription_history').insert({
      subscription_id: subscriptionId,
      event_type: 'cancelled',
      description: reason || 'Assinatura cancelada',
      user_id: user.id,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

### 4.6 Processar Pagamentos Vencidos (Cron)

**`supabase/functions/process-due-payments/index.ts`**

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar pagamentos vencidos e não pagos
    const today = new Date().toISOString().split('T')[0];
    
    const { data: overduePayments, error } = await supabase
      .from('subscription_payments')
      .select(`
        *,
        subscriptions!inner(
          *,
          asaas_configuration!inner(*)
        )
      `)
      .eq('status', 'pending')
      .lte('due_date', today)
      .limit(100);

    if (error) {
      throw error;
    }

    let processed = 0;
    let failed = 0;

    for (const payment of overduePayments || []) {
      try {
        // Marcar como vencido
        await supabase
          .from('subscription_payments')
          .update({
            status: 'overdue',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        // Criar histórico
        await supabase.from('subscription_history').insert({
          subscription_id: payment.subscription_id,
          event_type: 'payment_overdue',
          description: `Pagamento vencido: R$ ${payment.amount}`,
        });

        // Se auto_retry está ativo e ainda há tentativas
        if (
          payment.subscriptions.asaas_configuration.auto_retry_failed_payments &&
          payment.retry_count < payment.max_retries
        ) {
          // Incrementar retry
          const retryInterval = payment.subscriptions.asaas_configuration.retry_interval_days || 3;
          const nextRetry = new Date();
          nextRetry.setDate(nextRetry.getDate() + retryInterval);

          await supabase
            .from('subscription_payments')
            .update({
              retry_count: payment.retry_count + 1,
              next_retry_date: nextRetry.toISOString().split('T')[0],
              status: 'pending', // Voltar para pending para nova tentativa
            })
            .eq('id', payment.id);
        } else {
          // Pausar assinatura se excedeu tentativas
          if (payment.retry_count >= payment.max_retries) {
            await supabase
              .from('subscriptions')
              .update({
                status: 'paused',
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.subscription_id);

            await supabase.from('subscription_history').insert({
              subscription_id: payment.subscription_id,
              event_type: 'paused',
              description: 'Assinatura pausada devido a falhas de pagamento',
            });
          }
        }

        processed++;
      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        total: overduePayments?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process due payments error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 🎨 PARTE 5: FRONTEND

### 5.1 Hooks

**`src/hooks/useSubscriptions.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useSubscriptions() {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          clients(id, name),
          products(id, title)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.functions.invoke('create-subscription', {
        body: data,
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: 'Assinatura criada',
        description: 'A assinatura foi criada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar assinatura',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ subscriptionId, reason }: { subscriptionId: string; reason?: string }) => {
      const { data: result, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId, reason },
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: 'Assinatura cancelada',
        description: 'A assinatura foi cancelada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cancelar assinatura',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
```

### 5.2 Componentes (Estrutura)

- `src/components/subscriptions/SubscriptionTable.tsx`
- `src/components/subscriptions/NewSubscriptionModal.tsx`
- `src/components/subscriptions/SubscriptionDetails.tsx`
- `src/components/subscriptions/PaymentHistory.tsx`

---

## ⚙️ PARTE 6: CONFIGURAÇÃO E DEPLOY

### 6.1 Variáveis de Ambiente

No Supabase Dashboard → Settings → Edge Functions:

```
ASAAS_API_KEY=seu_api_key_aqui
ASAAS_ENVIRONMENT=production
ASAAS_WEBHOOK_SECRET=seu_secret_aqui (opcional)
```

### 6.2 Deploy das Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link projeto
supabase link --project-ref seu-project-ref

# Deploy functions
supabase functions deploy asaas-client
supabase functions deploy create-subscription
supabase functions deploy cancel-subscription
supabase functions deploy asaas-webhook
supabase functions deploy process-due-payments
```

### 6.3 Configurar Cron Job

No Vercel ou serviço de cron:

- **URL**: `https://[projeto].supabase.co/functions/v1/process-due-payments`
- **Frequência**: Diário às 00:00
- **Headers**: `Authorization: Bearer [SERVICE_ROLE_KEY]`

### 6.4 Configurar Webhook no Asaas

1. Painel Asaas → Integrações → Webhooks
2. URL: `https://[projeto].supabase.co/functions/v1/asaas-webhook`
3. Eventos selecionados:
   - PAYMENT_CONFIRMED
   - PAYMENT_RECEIVED
   - PAYMENT_OVERDUE
   - PAYMENT_REFUNDED
   - SUBSCRIPTION_CANCELLED
   - SUBSCRIPTION_UPDATED

---

## ✅ PARTE 7: CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Banco de Dados
- [ ] Criar migration com todas as tabelas
- [ ] Criar enums
- [ ] Criar índices
- [ ] Configurar RLS policies
- [ ] Criar funções auxiliares SQL
- [ ] Testar queries

### Fase 2: Configuração Asaas
- [ ] Criar conta no Asaas
- [ ] Obter API Key
- [ ] Configurar webhook
- [ ] Testar conexão com API

### Fase 3: Edge Functions
- [ ] Implementar asaas-client
- [ ] Implementar create-subscription
- [ ] Implementar cancel-subscription
- [ ] Implementar asaas-webhook
- [ ] Implementar process-due-payments
- [ ] Testar cada função

### Fase 4: Frontend
- [ ] Criar hooks useSubscriptions
- [ ] Criar componentes de UI
- [ ] Integrar com formulários
- [ ] Testar fluxo completo

### Fase 5: Integrações
- [ ] Integrar com finance_records
- [ ] Integrar com notificações
- [ ] Adicionar ao dashboard

### Fase 6: Testes
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Testes E2E
- [ ] Testes de webhook
- [ ] Testes de cron job

### Fase 7: Deploy
- [ ] Deploy migration
- [ ] Deploy Edge Functions
- [ ] Configurar variáveis de ambiente
- [ ] Configurar cron job
- [ ] Configurar webhook no Asaas
- [ ] Testes em produção

---

## 🧪 PARTE 8: TESTES

### 8.1 Testes Manuais

1. **Criar Assinatura**
   - Criar assinatura mensal
   - Verificar criação no Asaas
   - Verificar dados no banco

2. **Webhook**
   - Simular pagamento confirmado
   - Verificar atualização no banco
   - Verificar criação de finance_record

3. **Cancelar Assinatura**
   - Cancelar via frontend
   - Verificar cancelamento no Asaas
   - Verificar status no banco

### 8.2 Testes Automatizados

```typescript
// Exemplo de teste
describe('Asaas Integration', () => {
  it('should create subscription', async () => {
    const result = await createSubscription({
      clientId: '...',
      amount: 100,
      subscriptionType: 'monthly',
      // ...
    });
    
    expect(result.success).toBe(true);
    expect(result.subscription.asaas_subscription_id).toBeDefined();
  });
});
```

---

## 📊 PARTE 9: MONITORAMENTO

### 9.1 Métricas a Acompanhar

- Taxa de sucesso de criação de assinaturas
- Taxa de pagamentos confirmados
- Taxa de falhas de pagamento
- Tempo de processamento de webhooks
- Assinaturas canceladas

### 9.2 Logs

- Todos os eventos devem ser logados
- Webhooks devem ser salvos em `asaas_webhook_events`
- Erros devem ser reportados

---

## 🚀 CONCLUSÃO

Este plano cobre todos os aspectos necessários para integrar o Asaas como gateway de pagamento para assinaturas. Siga as fases em ordem e teste cada etapa antes de prosseguir.

**Próximos Passos**:
1. Revisar e aprovar o plano
2. Criar migration do banco de dados
3. Implementar Edge Functions
4. Testar integração
5. Implementar frontend
6. Deploy e monitoramento

---

**Última atualização**: 2025-01-XX
**Status**: Plano completo para implementação

