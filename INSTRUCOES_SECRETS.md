# 🔐 Configurar Secrets do Supabase - Asaas

## ⚠️ IMPORTANTE

**A API Key do Asaas DEVE ficar nos Secrets do Supabase, NUNCA no banco de dados!**

---

## 📋 Como Configurar

### Opção 1: Via Dashboard do Supabase

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Edge Functions** → **Secrets**
4. Clique em **Add Secret** ou **New Secret**
5. Configure:
   - **Name**: `ASAAS_API_KEY`
   - **Value**: Sua API Key do Asaas (sandbox ou produção)
6. Clique em **Save**

### Opção 2: Via CLI do Supabase

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login
supabase login

# Link projeto
supabase link --project-ref seu-project-ref

# Configurar secret
supabase secrets set ASAAS_API_KEY=sua_api_key_aqui
```

### Opção 3: Via API do Supabase

```bash
curl -X POST 'https://api.supabase.com/v1/projects/{project_id}/secrets' \
  -H 'Authorization: Bearer {access_token}' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "ASAAS_API_KEY",
    "value": "sua_api_key_aqui"
  }'
```

---

## ✅ Verificar Secret Configurado

### Via Dashboard:
- Settings → Edge Functions → Secrets
- Deve aparecer `ASAAS_API_KEY` na lista

### Via CLI:
```bash
supabase secrets list
```

---

## 🔄 Atualizar Secret

Se precisar atualizar a API Key:

```bash
supabase secrets set ASAAS_API_KEY=nova_api_key_aqui
```

As Edge Functions usarão automaticamente a nova key.

---

## 🚨 Segurança

### ✅ FAZER:
- ✅ Armazenar API Key nos Secrets do Supabase
- ✅ Usar diferentes secrets para sandbox e produção
- ✅ Rotacionar API Keys periodicamente

### ❌ NÃO FAZER:
- ❌ Armazenar API Key no banco de dados
- ❌ Commitar API Keys no código
- ❌ Compartilhar API Keys publicamente
- ❌ Usar API Key de produção em desenvolvimento

---

## 📝 Como as Edge Functions Usam

As Edge Functions leem a API Key assim:

```typescript
const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
```

Se o secret não estiver configurado, as funções retornarão erro informando que a API Key não foi encontrada.

---

**Última atualização**: 2025-01-XX
**Importante**: API Key sempre nos Secrets, nunca no banco!

