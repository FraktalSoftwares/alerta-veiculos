# Configuração do Asaas - Guia Completo

## 🔐 IMPORTANTE: Segurança

**A API Key do Asaas NÃO deve ser armazenada no banco de dados!**

A API Key deve ser configurada **APENAS** nos **Secrets do Supabase**.

---

## 📋 Passo a Passo

### 1. Criar Conta no Asaas

1. Acesse https://www.asaas.com
2. Crie uma conta empresarial
3. Complete a verificação de identidade
4. Acesse o painel administrativo

### 2. Obter API Key

1. No painel do Asaas: **Integrações** → **API**
2. Copie a **API Key**:
   - **Sandbox** (para testes): Use a API Key do ambiente de testes
   - **Produção**: Use a API Key do ambiente de produção

### 3. Configurar Secret no Supabase

**IMPORTANTE**: Configure a API Key nos Secrets do Supabase, NÃO no banco de dados!

#### Via Dashboard do Supabase:

1. Acesse: **Settings** → **Edge Functions** → **Secrets**
2. Clique em **Add Secret**
3. Adicione:
   - **Name**: `ASAAS_API_KEY`
   - **Value**: Sua API Key do Asaas
4. Clique em **Save**

#### Via CLI do Supabase:

```bash
supabase secrets set ASAAS_API_KEY=sua_api_key_aqui
```

### 4. Configurar Webhook no Asaas

1. No painel do Asaas: **Integrações** → **Webhooks**
2. Clique em **Adicionar Webhook**
3. Configure:
   - **URL**: `https://[seu-projeto].supabase.co/functions/v1/asaas-webhook`
     - Substitua `[seu-projeto]` pelo ID do seu projeto Supabase
   - **Eventos** (selecione todos):
     - ✅ `PAYMENT_CONFIRMED` - Pagamento confirmado
     - ✅ `PAYMENT_RECEIVED` - Pagamento recebido
     - ✅ `PAYMENT_OVERDUE` - Pagamento vencido
     - ✅ `PAYMENT_REFUNDED` - Pagamento reembolsado
     - ✅ `SUBSCRIPTION_CANCELLED` - Assinatura cancelada
     - ✅ `SUBSCRIPTION_UPDATED` - Assinatura atualizada
4. Salve o webhook

### 5. Criar Configuração no Banco de Dados

A configuração no banco armazena apenas **settings**, não a API Key:

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
    '[seu-user-id]',  -- ID do usuário admin/owner
    'sandbox',         -- ou 'production'
    'credit_card',
    true,
    3,
    3,
    true
);
```

**Campos da configuração:**
- `owner_id`: ID do usuário que gerencia (UUID do profile)
- `environment`: `'sandbox'` ou `'production'`
- `default_payment_method`: Método de pagamento padrão
- `auto_retry_failed_payments`: Se deve tentar novamente pagamentos falhados
- `max_retry_attempts`: Máximo de tentativas (padrão: 3)
- `retry_interval_days`: Intervalo entre tentativas em dias (padrão: 3)

---

## ✅ Checklist de Configuração

- [ ] Conta criada no Asaas
- [ ] API Key obtida (sandbox ou produção)
- [ ] Secret `ASAAS_API_KEY` configurado no Supabase
- [ ] Webhook configurado no Asaas
- [ ] Configuração criada no banco de dados (sem API key!)

---

## 🔍 Verificar Configuração

### Verificar Secret no Supabase:

```bash
# Via CLI
supabase secrets list

# Ou via Dashboard: Settings → Edge Functions → Secrets
```

### Verificar Configuração no Banco:

```sql
SELECT 
    id,
    owner_id,
    environment,
    default_payment_method,
    auto_retry_failed_payments,
    max_retry_attempts,
    retry_interval_days,
    is_active
FROM asaas_configuration
WHERE is_active = true;
```

---

## 🚨 Segurança

### ✅ FAZER:
- ✅ Armazenar API Key nos Secrets do Supabase
- ✅ Usar diferentes API Keys para sandbox e produção
- ✅ Rotacionar API Keys periodicamente
- ✅ Usar HTTPS para webhooks

### ❌ NÃO FAZER:
- ❌ Armazenar API Key no banco de dados
- ❌ Commitar API Keys no código
- ❌ Compartilhar API Keys publicamente
- ❌ Usar API Key de produção em desenvolvimento

---

## 📝 Variáveis de Ambiente Necessárias

No Supabase, configure apenas:

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `ASAAS_API_KEY` | API Key do Asaas | ✅ Sim |
| `ASAAS_ENVIRONMENT` | `sandbox` ou `production` | ❌ Não (usa do banco) |

**Nota**: `ASAAS_ENVIRONMENT` é opcional, pois a Edge Function lê do banco de dados.

---

## 🔄 Atualizar API Key

Se precisar atualizar a API Key:

1. **Nunca** atualize no banco de dados
2. Atualize apenas no Supabase Secrets:
   ```bash
   supabase secrets set ASAAS_API_KEY=nova_api_key
   ```
3. As Edge Functions usarão automaticamente a nova key

---

## 🧪 Testar Configuração

Após configurar, teste criando uma assinatura:

1. Acesse `/assinaturas` no sistema
2. Clique em "Nova Assinatura"
3. Preencha os dados
4. Se a API Key estiver correta, a assinatura será criada
5. Se houver erro, verifique os logs das Edge Functions

---

**Última atualização**: 2025-01-XX
**Importante**: API Key sempre nos Secrets, nunca no banco!

