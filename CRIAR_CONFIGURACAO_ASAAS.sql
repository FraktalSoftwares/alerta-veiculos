-- =============================================
-- Script para criar configuração inicial do Asaas
-- Execute este script após configurar o Secret ASAAS_API_KEY no Supabase
-- =============================================

-- IMPORTANTE: Substitua '[SEU-USER-ID]' pelo UUID do seu perfil
-- Você pode obter seu user_id assim:
-- SELECT id FROM profiles WHERE email = 'seu-email@exemplo.com';

-- Criar configuração do Asaas
INSERT INTO asaas_configuration (
    owner_id,
    environment,              -- 'sandbox' para testes ou 'production' para produção
    default_payment_method,
    auto_retry_failed_payments,
    max_retry_attempts,
    retry_interval_days,
    webhook_url,              -- URL do webhook (será configurada no Asaas)
    is_active,
    notes
)
VALUES (
    '[SEU-USER-ID]',          -- ⚠️ SUBSTITUA pelo seu user_id (UUID)
    'sandbox',                -- Use 'sandbox' para testes, 'production' para produção
    'credit_card',
    true,                     -- Tentar novamente pagamentos falhados automaticamente
    3,                        -- Máximo de 3 tentativas
    3,                        -- Intervalo de 3 dias entre tentativas
    NULL,                     -- Será preenchido após configurar webhook no Asaas
    true,
    'Configuração inicial do Asaas'
)
ON CONFLICT DO NOTHING;

-- Verificar se foi criado
SELECT 
    id,
    owner_id,
    environment,
    default_payment_method,
    auto_retry_failed_payments,
    max_retry_attempts,
    retry_interval_days,
    is_active,
    created_at
FROM asaas_configuration
WHERE owner_id = '[SEU-USER-ID]'  -- ⚠️ SUBSTITUA pelo seu user_id
ORDER BY created_at DESC
LIMIT 1;

