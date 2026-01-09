# ✅ Correções Aplicadas - Módulo Financeiro e Asaas

## 📋 Resumo

Foram identificados e corrigidos **5 problemas críticos** que impediam o funcionamento correto da integração com Asaas.

---

## 🔧 Correções Aplicadas

### 1. ✅ **create-subscription/index.ts** - Leitura de API Key

**Problema**: Tentava ler `api_key` do banco de dados, mas esse campo não existe.

**Correção**: Agora lê a API Key dos Secrets do Supabase via `Deno.env.get('ASAAS_API_KEY')`.

**Linhas alteradas**: 82-100

**Antes**:
```typescript
const asaasClient = getAsaasClient(asaasConfig.api_key, asaasConfig.environment);
```

**Depois**:
```typescript
// Ler API Key dos Secrets do Supabase (NÃO do banco de dados)
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

---

### 2. ✅ **cancel-subscription/index.ts** - Busca de Configuração e API Key

**Problema**: 
- Tentava fazer JOIN incorreto com `asaas_configuration`
- Tentava ler `api_key` do banco de dados

**Correção**: 
- Busca assinatura e configuração separadamente
- Lê API Key dos Secrets do Supabase

**Linhas alteradas**: 40-95

**Antes**:
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

// ...
const asaasClient = getAsaasClient(
  (subscription.asaas_configuration as any).api_key,
  (subscription.asaas_configuration as any).environment
);
```

**Depois**:
```typescript
// Buscar assinatura
const { data: subscription, error: subError } = await supabase
  .from('subscriptions')
  .select('*')
  .eq('id', subscriptionId)
  .eq('owner_id', user.id)
  .single();

// Buscar configuração do Asaas separadamente
const { data: asaasConfig, error: configError } = await supabase
  .from('asaas_configuration')
  .select('*')
  .eq('owner_id', subscription.owner_id)
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

// Ler API Key dos Secrets do Supabase
const apiKey = Deno.env.get(asaasConfig.secret_name || 'ASAAS_API_KEY');
if (!apiKey) {
  return new Response(
    JSON.stringify({ error: 'ASAAS_API_KEY não configurada nos Secrets do Supabase' }),
    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

const asaasClient = getAsaasClient(apiKey, asaasConfig.environment);
```

---

### 3. ✅ **process-due-payments/index.ts** - Busca de Configuração

**Problema**: Tentava fazer JOIN incorreto com `asaas_configuration` através de `subscriptions`.

**Correção**: Busca configuração separadamente para cada subscription usando `owner_id`.

**Linhas alteradas**: 15-50

**Antes**:
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
  // ...
  
for (const payment of overduePayments || []) {
  const subscription = payment.subscriptions;
  const config = subscription.asaas_configuration;
  // ...
}
```

**Depois**:
```typescript
const { data: overduePayments, error } = await supabase
  .from('subscription_payments')
  .select(`
    *,
    subscriptions!inner(
      id,
      owner_id
    )
  `)
  // ...
  
for (const payment of overduePayments || []) {
  const subscription = payment.subscriptions;
  
  // Buscar configuração do Asaas separadamente
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
  // ...
}
```

---

### 4. ✅ **asaas-webhook/index.ts** - Prevenção de Duplicados em finance_records

**Problema**: Verificação de duplicados usava apenas `description` e `amount`, que não é confiável.

**Correção**: Usa `metadata->>asaas_payment_id` para verificar duplicados e adiciona metadata ao inserir.

**Linhas alteradas**: 189-209 e 149-160

**Antes**:
```typescript
const { data: existingFinance } = await supabase
  .from('finance_records')
  .select('id')
  .eq('description', `Pagamento assinatura - ${payment.description || ''}`)
  .eq('amount', payment.value)
  .limit(1);

if (!existingFinance || existingFinance.length === 0) {
  await supabase.from('finance_records').insert({
    // ... sem metadata
  });
}
```

**Depois**:
```typescript
// Verificar por metadata para evitar duplicados
const { data: existingFinance } = await supabase
  .from('finance_records')
  .select('id')
  .eq('metadata->>asaas_payment_id', payment.id)
  .limit(1);

if (!existingFinance || existingFinance.length === 0) {
  await supabase.from('finance_records').insert({
    // ...
    metadata: {
      asaas_payment_id: payment.id,
      subscription_id: subscriptionPayment.subscription_id,
    },
  });
}
```

---

## 📝 Arquivos Modificados

1. ✅ `supabase/functions/create-subscription/index.ts`
2. ✅ `supabase/functions/cancel-subscription/index.ts`
3. ✅ `supabase/functions/process-due-payments/index.ts`
4. ✅ `supabase/functions/asaas-webhook/index.ts`

---

## ⚠️ Ações Necessárias ANTES de Testar

### 1. Configurar Secret no Supabase (OBRIGATÓRIO)

1. Acesse: **Supabase Dashboard** → **Settings** → **Edge Functions** → **Secrets**
2. Clique em **Add Secret**
3. Nome: `ASAAS_API_KEY`
4. Valor: Sua API Key do Asaas
5. Salve

### 2. Criar Configuração no Banco de Dados

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

### 3. Fazer Deploy das Edge Functions

```bash
supabase functions deploy create-subscription
supabase functions deploy cancel-subscription
supabase functions deploy process-due-payments
supabase functions deploy asaas-webhook
```

---

## 🧪 Testes Recomendados

Após aplicar as correções e configurações:

1. **Teste 1**: Criar assinatura
   - ✅ Deve funcionar sem erros
   - ✅ Deve criar no Asaas
   - ✅ Deve salvar no banco

2. **Teste 2**: Cancelar assinatura
   - ✅ Deve cancelar no Asaas
   - ✅ Deve atualizar status no banco

3. **Teste 3**: Webhook de pagamento
   - ✅ Simular webhook `PAYMENT_CONFIRMED`
   - ✅ Verificar se cria `finance_record` (sem duplicados)
   - ✅ Verificar se atualiza `subscription_payment`

4. **Teste 4**: Processar pagamentos vencidos
   - ✅ Executar `process-due-payments`
   - ✅ Verificar se marca como `overdue`
   - ✅ Verificar se agenda retry se configurado

---

## ✅ Status Final

**Antes das correções**: ❌ Não funcionava (erros de API Key)

**Depois das correções**: ✅ Deve funcionar após configurar Secrets e banco

**Próximos passos**:
1. Configurar Secret `ASAAS_API_KEY` no Supabase
2. Criar configuração no banco de dados
3. Fazer deploy das Edge Functions
4. Testar cada função

---

**Data das correções**: 2025-01-XX
**Status**: ✅ Correções aplicadas, aguardando configuração e testes
