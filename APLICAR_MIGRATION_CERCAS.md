# Como Aplicar a Migration de Cercas Virtuais no Supabase

## 📋 Migration Criada

A migration está em: `supabase/migrations/20250108000000_create_virtual_fences.sql`

## 🚀 Opção 1: Via Supabase Dashboard (Recomendado)

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)
4. Clique em **New Query**
5. Copie e cole todo o conteúdo do arquivo `supabase/migrations/20250108000000_create_virtual_fences.sql`
6. Clique em **Run** (ou pressione Ctrl+Enter)

## 🚀 Opção 2: Via Supabase CLI (se tiver projeto linkado)

Se você tiver o projeto linkado ao Supabase CLI:

```bash
# Linkar projeto (se ainda não estiver linkado)
supabase link --project-ref fjhozukksxzuazuykyhk

# Aplicar migration
supabase db push
```

## ✅ Verificar se foi aplicada

Após aplicar, verifique se a tabela foi criada:

1. No Supabase Dashboard, vá em **Table Editor**
2. Você deve ver a tabela `virtual_fences` na lista
3. Verifique se as colunas estão corretas:
   - id (uuid)
   - equipment_id (uuid)
   - name (text)
   - latitude (numeric)
   - longitude (numeric)
   - radius (integer)
   - speed_limit (integer)
   - is_primary (boolean)
   - notify_on_enter (boolean)
   - notify_on_exit (boolean)
   - created_at (timestamptz)
   - updated_at (timestamptz)

## 🔍 Verificar Políticas RLS

1. No Dashboard, vá em **Authentication** → **Policies**
2. Filtre por tabela `virtual_fences`
3. Você deve ver 4 políticas:
   - Users can view fences of their equipment
   - Users can create fences for their equipment
   - Users can update fences of their equipment
   - Users can delete fences of their equipment

## 📝 Conteúdo da Migration

A migration cria:
- ✅ Tabela `virtual_fences` com todos os campos
- ✅ Índices para performance
- ✅ Triggers para atualizar `updated_at` automaticamente
- ✅ Trigger para garantir apenas uma cerca principal por equipamento
- ✅ Políticas RLS (Row Level Security) completas
- ✅ Constraints de validação

## ⚠️ Importante

- A migration é **idempotente** (pode ser executada múltiplas vezes sem problemas)
- Se a tabela já existir, alguns comandos podem falhar, mas isso é normal
- As funções e triggers são criadas com `CREATE OR REPLACE`, então são seguras

## 🐛 Troubleshooting

### Erro: "relation already exists"
- A tabela já existe, isso é normal
- Pule os comandos CREATE TABLE e execute apenas os outros

### Erro: "function already exists"
- As funções já existem, isso é normal
- O `CREATE OR REPLACE` deve resolver isso

### Erro: "policy already exists"
- As políticas já existem
- Você pode dropar e recriar, ou simplesmente ignorar

