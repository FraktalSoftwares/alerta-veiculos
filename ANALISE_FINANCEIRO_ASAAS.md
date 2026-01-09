# 📊 Análise Completa: Módulo Financeiro e Integração Asaas

## ✅ Status Atual

### O que está funcionando:

1. **Banco de Dados** ✅
   - Migration `20250101000000_create_subscriptions_asaas.sql` aplicada
   - Todas as tabelas criadas: `subscriptions`, `subscription_payments`, `subscription_history`, `asaas_configuration`, `asaas_webhook_events`
   - Enums, índices e RLS policies configurados
   - Funções auxiliares SQL criadas

2. **Edge Functions - Estrutura** ✅
   - `asaas-client/index.ts` - Cliente completo para API Asaas
   - `create-subscription/index.ts` - Criar assinatura
   - `cancel-subscription/index.ts` - Cancelar assinatura
   - `asaas-webhook/index.ts` - Processar webhooks
   - `process-due-payments/index.ts` - Processar pagamentos vencidos

3. **Frontend - Estrutura** ✅
   - `src/pages/Assinaturas.tsx` - Página de assinaturas
   - `src/components/subscriptions/*` - Componentes de UI
   - `src/hooks/useSubscriptions.ts` - Hooks completos

4. **Integração Financeira** ✅
   - Webhook cria `finance_records` quando pagamento é confirmado
   - Integração com `subscription_payments` funcionando

---

## ❌ PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **PROBLEMA CRÍTICO: API Key não está sendo lida corretamente**

**Localização**: 
- `supabase/functions/create-subscription/index.ts` (linha 100)
- `supabase/functions/cancel-subscription/index.ts` (linhas 55, 81)

**Problema**:
As Edge Functions estão tentando acessar `asaasConfig.api_key` do banco de dados, mas:
- A migration `20250101000000_create_subscriptions_asaas.sql` **NÃO** tem o campo `api_key` na tabela `asaas_configuration`
- A API Key deve ser lida dos **Secrets do Supabase** via `Deno.env.get('ASAAS_API_KEY')`
- A tabela tem apenas `secret_name` (padrão: 'ASAAS_API_KEY')

**Impacto**: 
- ❌ Criar assinatura falha com erro "Cannot read property 'api_key' of undefined"
- ❌ Cancelar assinatura falha com o mesmo erro

**Solução Necessária**:
```typescript
// ❌ ERRADO (atual):
const asaasClient = getAsaasClient(asaasConfig.api_key, asaasConfig.environment);

// ✅ CORRETO:
const apiKey = Deno.env.get(asaasConfig.secret_name || 'ASAAS_API_KEY');
if (!apiKey) {
  throw new Error('ASAAS_API_KEY não configurada nos Secrets do Supabase');
}
const asaasClient = getAsaasClient(apiKey, asaasConfig.environment);
```

---

### 2. **PROBLEMA: Relação entre subscription e asaas_configuration**

**Localização**: `supabase/functions/cancel-subscription/index.ts` (linha 54)

**Problema**:
A query está tentando fazer JOIN com `asaas_configuration` diretamente na subscription, mas não há relação direta. A configuração deve ser buscada pelo `owner_id`.

**Solução Necessária**:
```typescript
// Buscar configuração separadamente pelo owner_id
const { data: asaasConfig } = await supabase
  .from('asaas_configuration')
  .select('*')
  .eq('owner_id', subscription.owner_id)
  .eq('is_active', true)
  .single();
```

---

### 3. **PROBLEMA: Falta validação de configuração do Asaas**

**Localização**: Todas as Edge Functions

**Problema**:
Não há verificação se:
- O Secret `ASAAS_API_KEY` está configurado no Supabase
- A configuração existe no banco de dados
- A configuração está ativa

**Solução Necessária**:
Adicionar validações no início de cada função.

---

### 4. **PROBLEMA: Webhook pode criar finance_records duplicados**

**Localização**: `supabase/functions/asaas-webhook/index.ts` (linhas 189-209)

**Problema**:
A verificação de duplicados usa apenas `description` e `amount`, que pode não ser suficiente. Deve usar `asaas_payment_id` ou uma referência única.

**Solução Necessária**:
```typescript
// Verificar por asaas_payment_id ao invés de description
const { data: existingFinance } = await supabase
  .from('finance_records')
  .select('id')
  .eq('metadata->>asaas_payment_id', payment.id)
  .limit(1);
```

---

### 5. **PROBLEMA: process-due-payments não busca configuração corretamente**

**Localização**: `supabase/functions/process-due-payments/index.ts` (linha 24)

**Problema**:
A query tenta fazer JOIN com `asaas_configuration` através de `subscriptions`, mas não há relação direta. Deve buscar por `owner_id`.

**Solução Necessária**:
Buscar configuração separadamente para cada subscription.

---

## ⚠️ PROBLEMAS MENORES

### 6. **Falta tratamento de erros mais detalhado**

**Localização**: Todas as Edge Functions

**Problema**:
Erros genéricos não ajudam no debug. Falta logging detalhado.

**Solução**: Adicionar mais logs e mensagens de erro específicas.

---

### 7. **Falta sincronização de pagamentos**

**Problema**:
Quando uma assinatura é criada no Asaas, os pagamentos futuros não são criados automaticamente no banco. Eles só aparecem quando o webhook é recebido.

**Solução**: Criar função de sincronização ou criar pagamentos iniciais ao criar assinatura.

---

### 8. **Falta validação de dados de entrada**

**Localização**: `create-subscription/index.ts`

**Problema**:
Não valida se:
- `billingDay` está entre 1-31
- `amount` é positivo
- `clientId` existe e pertence ao usuário
- `creditCard` está completo se `paymentMethod === 'credit_card'`

---

## 📋 CHECKLIST DE CORREÇÕES NECESSÁRIAS

### Prioridade ALTA (Bloqueia funcionamento):

- [ ] **CRÍTICO**: Corrigir leitura de API Key nas Edge Functions
  - [ ] `create-subscription/index.ts` - Linha 100
  - [ ] `cancel-subscription/index.ts` - Linhas 55, 81
  - [ ] Usar `Deno.env.get('ASAAS_API_KEY')` ao invés de `asaasConfig.api_key`

- [ ] **CRÍTICO**: Corrigir busca de configuração em `cancel-subscription`
  - [ ] Remover JOIN incorreto
  - [ ] Buscar configuração por `owner_id` separadamente

- [ ] **CRÍTICO**: Corrigir busca de configuração em `process-due-payments`
  - [ ] Buscar configuração por `owner_id` para cada subscription

### Prioridade MÉDIA (Melhora funcionamento):

- [ ] Adicionar validações de entrada em `create-subscription`
- [ ] Melhorar verificação de duplicados em `asaas-webhook`
- [ ] Adicionar logs detalhados em todas as funções
- [ ] Adicionar tratamento de erros mais específico

### Prioridade BAIXA (Melhorias futuras):

- [ ] Criar função de sincronização de pagamentos
- [ ] Adicionar retry automático para falhas de API
- [ ] Criar dashboard de monitoramento
- [ ] Adicionar testes automatizados

---

## 🔧 CORREÇÕES NECESSÁRIAS

### Correção 1: create-subscription/index.ts

**Linha 100** - Substituir:
```typescript
const asaasClient = getAsaasClient(asaasConfig.api_key, asaasConfig.environment);
```

**Por**:
```typescript
// Ler API Key dos Secrets do Supabase
const apiKey = Deno.env.get(asaasConfig.secret_name || 'ASAAS_API_KEY');
if (!apiKey) {
  return new Response(
    JSON.stringify({ 
      error: 'ASAAS_API_KEY não configurada nos Secrets do Supabase. Configure em Settings → Edge Functions → Secrets.' 
    }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const asaasClient = getAsaasClient(apiKey, asaasConfig.environment);
```

### Correção 2: cancel-subscription/index.ts

**Linhas 49-68** - Substituir query:
```typescript
const { data: subscription, error: subError } = await supabase
  .from('subscriptions')
  .select(`
    *,
    asaas_configuration!inner(
      api_key,
      environment
    )
  `)
  .eq('id', subscriptionId)
  .eq('owner_id', user.id)
  .single();
```

**Por**:
```typescript
// Buscar assinatura
const { data: subscription, error: subError } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('id', subscriptionId)
  .eq('owner_id', user.id)
  .single();

if (subError || !subscription) {
  return new Response(
    JSON.stringify({ error: 'Assinatura não encontrada' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Buscar configuração do Asaas separadamente
const { data: asaasConfig, error: configError } = await supabase
  .from('asaas_configuration')
  .select('*')
  .eq('owner_id', subscription.owner_id)
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

// Ler API Key dos Secrets
const apiKey = Deno.env.get(asaasConfig.secret_name || 'ASAAS_API_KEY');
if (!apiKey) {
  return new Response(
    JSON.stringify({ error: 'ASAAS_API_KEY não configurada nos Secrets do Supabase' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

**Linha 81** - Substituir:
```typescript
const asaasClient = getAsaasClient(
  (subscription.asaas_configuration as any).api_key,
  (subscription.asaas_configuration as any).environment
);
```

**Por**:
```typescript
const asaasClient = getAsaasClient(apiKey, asaasConfig.environment);
```

### Correção 3: process-due-payments/index.ts

**Linhas 18-33** - Substituir query:
```typescript
const { data: overduePayments, error } = await supabase
  .from('subscription_payments')
  .select(`
    *,
    subscriptions!inner(
      *,
      asaas_configuration!inner(
        auto_retry_failed_payments,
        max_retry_attempts,
        retry_interval_days
      )
    )
  `)
  .eq('status', 'pending')
  .lte('due_date', today)
  .limit(100);
```

**Por**:
```typescript
// Buscar pagamentos vencidos
const { data: overduePayments, error } = await supabase
  .from('subscription_payments')
  .select(`
    *,
    subscriptions!inner(
      id,
      owner_id
    )
  `)
  .eq('status', 'pending')
  .lte('due_date', today)
  .limit(100);

// Para cada pagamento, buscar configuração separadamente
for (const payment of overduePayments || []) {
  const subscription = payment.subscriptions;
  
  // Buscar configuração
  const { data: config } = await supabase
    .from('asaas_configuration')
    .select('*')
    .eq('owner_id', subscription.owner_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  // Usar valores padrão se não houver configuração
  const maxRetries = config?.max_retry_attempts || 3;
  const retryInterval = config?.retry_interval_days || 3;
  const autoRetry = config?.auto_retry_failed_payments ?? true;
  
  // ... resto do código
}
```

### Correção 4: asaas-webhook/index.ts

**Linhas 189-195** - Melhorar verificação de duplicados:
```typescript
// Criar registro financeiro se ainda não existe
// Usar metadata para evitar duplicados
const { data: existingFinance } = await supabase
  .from('finance_records')
  .select('id')
  .eq('metadata->>asaas_payment_id', payment.id)
  .limit(1);

if (!existingFinance || existingFinance.length === 0) {
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
    metadata: {
      asaas_payment_id: payment.id,
      subscription_id: subscriptionPayment.subscription_id,
    },
  });
}
```

---

## ✅ CONFIGURAÇÃO NECESSÁRIA

### 1. Secrets do Supabase

**OBRIGATÓRIO**: Configurar o Secret `ASAAS_API_KEY` no Supabase:

1. Acesse: **Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets**
2. Clique em **Add Secret**
3. Nome: `ASAAS_API_KEY`
4. Valor: Sua API Key do Asaas (sandbox ou produção)
5. Salve

### 2. Configuração no Banco de Dados

Execute o script `CRIAR_CONFIGURACAO_ASAAS.sql` ou:

```sql
INSERT INTO asaas_configuration (
    owner_id,
    environment,
    default_payment_method,
    auto_retry_failed_payments,
    max_retry_attempts,
    retry_interval_days,
    is_active
)
VALUES (
    '[SEU-USER-ID]',  -- UUID do seu perfil
    'sandbox',        -- ou 'production'
    'credit_card',
    true,
    3,
    3,
    true
);
```

### 3. Webhook no Asaas

1. Painel Asaas → **Integrações** → **Webhooks**
2. URL: `https://[seu-projeto].supabase.co/functions/v1/asaas-webhook`
3. Eventos:
   - ✅ `PAYMENT_CONFIRMED`
   - ✅ `PAYMENT_RECEIVED`
   - ✅ `PAYMENT_OVERDUE`
   - ✅ `PAYMENT_REFUNDED`
   - ✅ `SUBSCRIPTION_CANCELLED`
   - ✅ `SUBSCRIPTION_UPDATED`

---

## 🧪 TESTES NECESSÁRIOS

Após aplicar as correções:

1. **Teste 1**: Criar assinatura
   - Deve funcionar sem erros
   - Deve criar no Asaas
   - Deve salvar no banco

2. **Teste 2**: Cancelar assinatura
   - Deve cancelar no Asaas
   - Deve atualizar status no banco

3. **Teste 3**: Webhook de pagamento
   - Simular webhook `PAYMENT_CONFIRMED`
   - Verificar se cria `finance_record`
   - Verificar se atualiza `subscription_payment`

4. **Teste 4**: Processar pagamentos vencidos
   - Executar `process-due-payments`
   - Verificar se marca como `overdue`
   - Verificar se agenda retry se configurado

---

## 📝 RESUMO

### Status Geral: ⚠️ **PARCIALMENTE FUNCIONAL**

**O que funciona**:
- ✅ Estrutura de banco de dados completa
- ✅ Edge Functions criadas (mas com bugs)
- ✅ Frontend implementado
- ✅ Integração com finance_records (com melhorias necessárias)

**O que NÃO funciona**:
- ❌ Criar assinatura (erro de API Key)
- ❌ Cancelar assinatura (erro de API Key)
- ⚠️ Processar pagamentos vencidos (busca incorreta de configuração)

**Ações Imediatas**:
1. ✅ Aplicar correções nas Edge Functions (prioridade ALTA)
2. ✅ Configurar Secret `ASAAS_API_KEY` no Supabase
3. ✅ Criar configuração no banco de dados
4. ✅ Testar cada função após correções

---

**Última atualização**: 2025-01-XX
**Próximos passos**: Aplicar correções críticas
