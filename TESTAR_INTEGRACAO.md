# 🧪 Como Testar a Integração Asaas

## ✅ Pré-requisitos

- [x] Secret `ASAAS_API_KEY` configurado no Supabase
- [x] Configuração criada no banco de dados
- [x] Edge Functions deployadas
- [x] Conta no Asaas criada

---

## 🧪 Teste 1: Verificar Secret Configurado

### Via Dashboard:
1. Settings → Edge Functions → Secrets
2. Verificar se `ASAAS_API_KEY` está na lista

### Via Teste de Edge Function:
```bash
# Testar se a função consegue ler o secret
curl -X POST 'https://[projeto].supabase.co/functions/v1/create-subscription' \
  -H 'Authorization: Bearer [seu-token]' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

Se retornar erro sobre API Key não encontrada, o secret não está configurado.

---

## 🧪 Teste 2: Criar Configuração no Banco

Execute o script `CRIAR_CONFIGURACAO_ASAAS.sql` ou:

```sql
-- Primeiro, descubra seu user_id
SELECT id, full_name, email FROM profiles WHERE email = 'seu-email@exemplo.com';

-- Depois, crie a configuração
INSERT INTO asaas_configuration (
    owner_id,
    environment,
    is_active
)
VALUES (
    '[seu-user-id]',  -- Use o ID obtido acima
    'sandbox',
    true
);
```

---

## 🧪 Teste 3: Criar Primeira Assinatura

1. Acesse `/assinaturas` no sistema
2. Clique em "Nova Assinatura"
3. Preencha:
   - Cliente (selecione um cliente existente)
   - Período: Mensal
   - Valor: R$ 100,00 (exemplo)
   - Dia de vencimento: 10
   - Método de pagamento: PIX (mais fácil para teste)
4. Clique em "Criar Assinatura"

### O que deve acontecer:
- ✅ Assinatura criada no Asaas
- ✅ Assinatura salva no banco
- ✅ Cliente criado no Asaas (se não existir)
- ✅ ID do Asaas salvo no banco

### Verificar no Asaas:
1. Painel Asaas → Assinaturas
2. Deve aparecer a nova assinatura

### Verificar no Banco:
```sql
SELECT 
    s.id,
    s.asaas_subscription_id,
    s.status,
    s.amount,
    c.name as cliente
FROM subscriptions s
JOIN clients c ON c.id = s.client_id
ORDER BY s.created_at DESC
LIMIT 5;
```

---

## 🧪 Teste 4: Testar Webhook

### Simular Webhook do Asaas:

```bash
curl -X POST 'https://[projeto].supabase.co/functions/v1/asaas-webhook' \
  -H 'Content-Type: application/json' \
  -d '{
    "event": "PAYMENT_CONFIRMED",
    "payment": {
      "id": "pay_test_123",
      "subscription": "sub_test_123",
      "value": 100.00,
      "dueDate": "2025-01-10",
      "confirmationDate": "2025-01-10",
      "billingType": "PIX",
      "description": "Teste"
    }
  }'
```

### Verificar se foi processado:
```sql
SELECT 
    id,
    event_type,
    processed,
    processed_at,
    error_message
FROM asaas_webhook_events
ORDER BY created_at DESC
LIMIT 5;
```

---

## 🧪 Teste 5: Cancelar Assinatura

1. Na página `/assinaturas`
2. Clique nos três pontos de uma assinatura ativa
3. Clique em "Cancelar"
4. Preencha motivo (opcional)
5. Confirme

### Verificar:
- ✅ Status mudou para 'cancelled' no banco
- ✅ Assinatura cancelada no Asaas
- ✅ Histórico criado

```sql
SELECT 
    s.id,
    s.status,
    s.cancelled_at,
    s.cancellation_reason
FROM subscriptions s
WHERE s.status = 'cancelled'
ORDER BY s.cancelled_at DESC
LIMIT 5;
```

---

## 🧪 Teste 6: Processar Pagamentos Vencidos

### Executar manualmente:
```bash
curl -X POST 'https://[projeto].supabase.co/functions/v1/process-due-payments' \
  -H 'Authorization: Bearer [SERVICE_ROLE_KEY]'
```

### Verificar resultado:
- Deve retornar JSON com `processed`, `failed`, `paused`, `total`

---

## ❌ Problemas Comuns

### Erro: "API Key do Asaas não configurada"
**Solução**: Configure o secret `ASAAS_API_KEY` no Supabase

### Erro: "Configuração do Asaas não encontrada"
**Solução**: Execute o script `CRIAR_CONFIGURACAO_ASAAS.sql`

### Erro: "Cliente não encontrado"
**Solução**: Crie um cliente primeiro em `/clientes`

### Webhook não está sendo processado
**Solução**: 
1. Verifique se o webhook está configurado no Asaas
2. Verifique a URL do webhook
3. Verifique os logs da Edge Function

---

## ✅ Checklist de Testes

- [ ] Secret configurado
- [ ] Configuração criada no banco
- [ ] Criar assinatura funciona
- [ ] Assinatura aparece no Asaas
- [ ] Cancelar assinatura funciona
- [ ] Webhook recebe eventos
- [ ] Pagamentos são processados

---

**Última atualização**: 2025-01-XX

