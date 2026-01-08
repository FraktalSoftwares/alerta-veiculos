-- =============================================
-- INTEGRAÇÃO ASAAS - ASSINATURAS
-- Migration: Criar estrutura completa de assinaturas com integração Asaas
-- =============================================

-- Enums necessários
DO $$ BEGIN
    CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired', 'trial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'overdue', 'refunded', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_billing_cycle AS ENUM ('monthly', 'quarterly', 'annual', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM ('credit_card', 'debit_card', 'pix', 'boleto', 'bank_slip');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- TABELA: subscriptions
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
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
CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON public.subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_owner ON public.subscriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_asaas_id ON public.subscriptions(asaas_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON public.subscriptions(created_at DESC);

-- =============================================
-- TABELA: subscription_items
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id),
    vehicle_id UUID REFERENCES public.vehicles(id),
    
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_items_subscription ON public.subscription_items(subscription_id);

-- =============================================
-- TABELA: subscription_payments
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscription_payments (
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

CREATE INDEX IF NOT EXISTS idx_subscription_payments_subscription ON public.subscription_payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON public.subscription_payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_due_date ON public.subscription_payments(due_date);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_asaas_id ON public.subscription_payments(asaas_payment_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_next_retry ON public.subscription_payments(next_retry_date) WHERE status = 'failed';

-- =============================================
-- TABELA: subscription_history
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscription_history (
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

CREATE INDEX IF NOT EXISTS idx_subscription_history_subscription ON public.subscription_history(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_type ON public.subscription_history(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON public.subscription_history(created_at DESC);

-- =============================================
-- TABELA: asaas_configuration
-- =============================================
CREATE TABLE IF NOT EXISTS public.asaas_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) NOT NULL, -- Quem gerencia
    
    -- Configurações
    -- ⚠️ IMPORTANTE: API Key deve ficar nos SECRETS do Supabase (ASAAS_API_KEY)
    -- NÃO armazenar API keys no banco de dados!
    -- A API Key é lida via Deno.env.get('ASAAS_API_KEY') nas Edge Functions
    environment TEXT NOT NULL DEFAULT 'sandbox', -- production, sandbox
    secret_name TEXT DEFAULT 'ASAAS_API_KEY', -- Nome do secret no Supabase (padrão: ASAAS_API_KEY)
    
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

CREATE INDEX IF NOT EXISTS idx_asaas_config_owner ON public.asaas_configuration(owner_id);
CREATE INDEX IF NOT EXISTS idx_asaas_config_active ON public.asaas_configuration(is_active);

-- =============================================
-- TABELA: asaas_webhook_events
-- =============================================
CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
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

CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_type ON public.asaas_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_processed ON public.asaas_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_asaas_id ON public.asaas_webhook_events(asaas_event_id);

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
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" 
ON public.subscriptions FOR SELECT 
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can create subscriptions for own clients" ON public.subscriptions;
CREATE POLICY "Users can create subscriptions for own clients" 
ON public.subscriptions FOR INSERT 
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions" 
ON public.subscriptions FOR UPDATE 
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage all subscriptions" 
ON public.subscriptions FOR ALL 
USING (public.is_admin(auth.uid()));

-- Subscription Items
DROP POLICY IF EXISTS "Users can manage items of own subscriptions" ON public.subscription_items;
CREATE POLICY "Users can manage items of own subscriptions" 
ON public.subscription_items FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE subscriptions.id = subscription_items.subscription_id 
    AND subscriptions.owner_id = auth.uid()
));

-- Subscription Payments
DROP POLICY IF EXISTS "Users can view payments of own subscriptions" ON public.subscription_payments;
CREATE POLICY "Users can view payments of own subscriptions" 
ON public.subscription_payments FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE subscriptions.id = subscription_payments.subscription_id 
    AND subscriptions.owner_id = auth.uid()
));

DROP POLICY IF EXISTS "System can insert payments" ON public.subscription_payments;
CREATE POLICY "System can insert payments" 
ON public.subscription_payments FOR INSERT 
WITH CHECK (true); -- Edge Functions precisam inserir

DROP POLICY IF EXISTS "System can update payments" ON public.subscription_payments;
CREATE POLICY "System can update payments" 
ON public.subscription_payments FOR UPDATE 
USING (true); -- Edge Functions precisam atualizar

-- Subscription History
DROP POLICY IF EXISTS "Users can view history of own subscriptions" ON public.subscription_history;
CREATE POLICY "Users can view history of own subscriptions" 
ON public.subscription_history FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE subscriptions.id = subscription_history.subscription_id 
    AND subscriptions.owner_id = auth.uid()
));

DROP POLICY IF EXISTS "System can insert history" ON public.subscription_history;
CREATE POLICY "System can insert history" 
ON public.subscription_history FOR INSERT 
WITH CHECK (true);

-- Asaas Configuration
DROP POLICY IF EXISTS "Users can view own config" ON public.asaas_configuration;
CREATE POLICY "Users can view own config" 
ON public.asaas_configuration FOR SELECT 
USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage all configs" ON public.asaas_configuration;
CREATE POLICY "Admins can manage all configs" 
ON public.asaas_configuration FOR ALL 
USING (public.is_admin(auth.uid()));

-- Webhook Events
DROP POLICY IF EXISTS "Users can view webhook events" ON public.asaas_webhook_events;
CREATE POLICY "Users can view webhook events" 
ON public.asaas_webhook_events FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.subscriptions 
        WHERE subscriptions.id = asaas_webhook_events.subscription_id 
        AND subscriptions.owner_id = auth.uid()
    ) OR auth.uid() IS NULL -- Para webhooks
);

DROP POLICY IF EXISTS "System can insert webhook events" ON public.asaas_webhook_events;
CREATE POLICY "System can insert webhook events" 
ON public.asaas_webhook_events FOR INSERT 
WITH CHECK (true);

-- =============================================
-- FUNÇÕES AUXILIARES
-- =============================================

-- Função para obter configuração ativa do Asaas
-- ⚠️ NOTA: api_key NÃO é retornada, deve ser obtida dos secrets do Supabase
-- A API Key é lida via Deno.env.get('ASAAS_API_KEY') nas Edge Functions
CREATE OR REPLACE FUNCTION public.get_asaas_config(_owner_id UUID)
RETURNS TABLE (
    id UUID,
    environment TEXT,
    default_payment_method payment_method_type,
    auto_retry_failed_payments BOOLEAN,
    max_retry_attempts INTEGER,
    retry_interval_days INTEGER,
    secret_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ac.id,
        ac.environment,
        ac.default_payment_method,
        ac.auto_retry_failed_payments,
        ac.max_retry_attempts,
        ac.retry_interval_days,
        ac.secret_name
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

-- Adicionar coluna asaas_customer_id na tabela clients (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'clients' 
        AND column_name = 'asaas_customer_id'
    ) THEN
        ALTER TABLE public.clients ADD COLUMN asaas_customer_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_clients_asaas_customer ON public.clients(asaas_customer_id);
    END IF;
END $$;

