# Mapeamento: Assinaturas e Vendas de Produtos

## 📋 Visão Geral

Este documento mapeia todos os pontos do sistema relacionados a **assinaturas** e **vendas de produtos**, identificando o que já existe e o que precisa ser implementado.

---

## 🛒 PARTE 1: VENDAS DE PRODUTOS (JÁ IMPLEMENTADO)

### 1.1 Estrutura de Banco de Dados

#### Tabelas Existentes

**`products`** - Catálogo de produtos
- ✅ `id` (UUID)
- ✅ `title` (TEXT) - Nome do produto
- ✅ `description` (TEXT) - Descrição
- ✅ `image_url` (TEXT) - URL da imagem principal
- ✅ `vehicle_type` (TEXT) - Tipo de veículo
- ✅ `frequency` (TEXT) - Frequência
- ✅ `brand` (TEXT) - Marca
- ✅ `model` (TEXT) - Modelo
- ✅ `price` (DECIMAL) - Preço
- ✅ `stock_quantity` (INTEGER) - Quantidade em estoque
- ✅ `is_active` (BOOLEAN) - Produto ativo/inativo
- ✅ `created_at`, `updated_at`

**`product_images`** - Múltiplas imagens por produto
- ✅ `id` (UUID)
- ✅ `product_id` (UUID) - FK para products
- ✅ `image_url` (TEXT)
- ✅ `is_primary` (BOOLEAN)
- ✅ `display_order` (INTEGER)
- ✅ `created_at`

**`orders`** - Pedidos de compra
- ✅ `id` (UUID)
- ✅ `buyer_id` (UUID) - FK para profiles (quem comprou)
- ✅ `status` (order_status ENUM) - pending, approved, shipped, delivered, cancelled
- ✅ `total_amount` (DECIMAL) - Valor total
- ✅ `notes` (TEXT) - Observações/endereço de entrega
- ✅ `created_at`, `updated_at`

**`order_items`** - Itens de cada pedido
- ✅ `id` (UUID)
- ✅ `order_id` (UUID) - FK para orders
- ✅ `product_id` (UUID) - FK para products
- ✅ `quantity` (INTEGER) - Quantidade comprada
- ✅ `unit_price` (DECIMAL) - Preço unitário no momento da compra
- ✅ `created_at`

**`equipment`** - Equipamentos gerados após compra
- ✅ `id` (UUID)
- ✅ `owner_id` (UUID) - FK para profiles (proprietário)
- ✅ `product_id` (UUID) - FK para products
- ✅ `serial_number` (TEXT) - Número de série único
- ✅ `imei` (TEXT)
- ✅ `chip_number` (TEXT)
- ✅ `chip_operator` (TEXT)
- ✅ `status` (equipment_status ENUM) - available, installed, maintenance, defective
- ✅ `vehicle_id` (UUID) - FK para vehicles (quando instalado)
- ✅ `created_at`, `updated_at`

#### Enums Existentes

```sql
-- Status de pedidos
CREATE TYPE order_status AS ENUM ('pending', 'approved', 'shipped', 'delivered', 'cancelled');

-- Status de equipamentos
CREATE TYPE equipment_status AS ENUM ('available', 'installed', 'maintenance', 'defective');
```

### 1.2 Frontend - Componentes

#### Páginas
- ✅ **`src/pages/Loja.tsx`** - Página principal da loja
  - Exibe produtos diferentes para Admin vs Compradores
  - Admin: gerencia produtos (CRUD)
  - Compradores: visualiza e compra produtos

#### Componentes de Loja
- ✅ **`src/components/store/StorePageHeader.tsx`** - Cabeçalho com busca e botão novo
- ✅ **`src/components/store/StoreTable.tsx`** - Tabela de produtos (Admin)
- ✅ **`src/components/store/BuyerStoreTable.tsx`** - Tabela de produtos (Compradores)
- ✅ **`src/components/store/StoreTableHeader.tsx`** - Cabeçalho da tabela
- ✅ **`src/components/store/StoreTableRow.tsx`** - Linha da tabela
- ✅ **`src/components/store/NewProductModal.tsx`** - Modal criar produto
- ✅ **`src/components/store/EditProductModal.tsx`** - Modal editar produto
- ✅ **`src/components/store/DeleteProductDialog.tsx`** - Dialog confirmar exclusão
- ✅ **`src/components/store/ProductImageUpload.tsx`** - Upload de imagens
- ✅ **`src/components/store/CartContext.tsx`** - Context do carrinho
- ✅ **`src/components/store/CartButton.tsx`** - Botão do carrinho
- ✅ **`src/components/store/CartItemRow.tsx`** - Item do carrinho
- ✅ **`src/components/store/CheckoutDrawer.tsx`** - Drawer de checkout (3 etapas)
- ✅ **`src/components/store/AddressForm.tsx`** - Formulário de endereço
- ✅ **`src/components/store/PaymentForm.tsx`** - Formulário de pagamento

### 1.3 Frontend - Hooks

- ✅ **`src/hooks/useProducts.ts`**
  - `useProducts()` - Lista produtos com filtros
  - `useProduct(id)` - Busca produto específico
  - `useCreateProduct()` - Cria produto
  - `useUpdateProduct()` - Atualiza produto
  - `useDeleteProduct()` - Deleta produto (com validações)

- ✅ **`src/hooks/useOrders.ts`**
  - `useCreateOrder()` - Cria pedido via Edge Function
  - `useOrders()` - Lista pedidos do usuário

- ✅ **`src/hooks/useProductImages.ts`** - Gerencia imagens de produtos

### 1.4 Backend - Edge Functions

- ✅ **`supabase/functions/process-order/index.ts`**
  - Valida usuário autenticado
  - Verifica tipo de usuário (apenas associacao/franqueado podem comprar)
  - Valida produtos e estoque
  - Cria pedido e itens
  - Processa pagamento (simulado)
  - Atualiza estoque
  - Cria equipamentos automaticamente
  - Retorna resultado

### 1.5 Fluxo de Venda Atual

```
1. Usuário (associacao/franqueado) acessa Loja
   ↓
2. Visualiza produtos ativos
   ↓
3. Adiciona produtos ao carrinho (CartContext)
   ↓
4. Clica em "Finalizar Compra"
   ↓
5. CheckoutDrawer abre (3 etapas):
   a) Carrinho - revisa itens
   b) Endereço - preenche dados de entrega
   c) Pagamento - preenche dados do cartão
   ↓
6. Submete pedido via useCreateOrder()
   ↓
7. Edge Function process-order:
   - Valida estoque
   - Cria order + order_items
   - Processa pagamento (simulado)
   - Decrementa estoque
   - Cria equipment para cada unidade comprada
   - Atualiza status do pedido
   ↓
8. Retorna sucesso e atualiza cache
   ↓
9. Equipamentos aparecem no estoque do comprador
```

### 1.6 Permissões e Regras de Negócio

- ✅ **Produtos**: Apenas Admin pode criar/editar/deletar
- ✅ **Visualização**: Todos podem ver produtos ativos
- ✅ **Compra**: Apenas `associacao` e `franqueado` podem comprar
- ✅ **Estoque**: Decrementado automaticamente após compra
- ✅ **Equipamentos**: Criados automaticamente após compra bem-sucedida
- ✅ **Pedidos**: Usuário vê apenas seus próprios pedidos

---

## 🔄 PARTE 2: ASSINATURAS (NÃO IMPLEMENTADO - NECESSÁRIO)

### 2.1 Estrutura de Banco de Dados Necessária

#### Tabelas a Criar

**`subscriptions`** - Assinaturas de clientes
```sql
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) NOT NULL, -- Quem gerencia a assinatura
    product_id UUID REFERENCES public.products(id), -- Produto/serviço da assinatura (opcional)
    
    -- Dados da assinatura
    subscription_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'annual', 'custom'
    amount DECIMAL(10, 2) NOT NULL, -- Valor da assinatura
    billing_cycle INTEGER DEFAULT 1, -- Ciclo em meses (1=mensal, 3=trimestral, 12=anual)
    billing_day INTEGER CHECK (billing_day >= 1 AND billing_day <= 31), -- Dia do mês para cobrança
    
    -- Status
    status subscription_status DEFAULT 'active', -- active, paused, cancelled, expired
    start_date DATE NOT NULL,
    end_date DATE, -- NULL para assinaturas sem fim
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Configurações
    auto_renew BOOLEAN DEFAULT true,
    payment_method TEXT, -- 'credit_card', 'debit_card', 'pix', 'boleto'
    payment_token TEXT, -- Token do gateway de pagamento (se houver)
    
    -- Metadados
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'cancelled', 'expired');
```

**`subscription_items`** - Itens/serviços incluídos na assinatura
```sql
CREATE TABLE public.subscription_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id), -- Produto/serviço incluído
    vehicle_id UUID REFERENCES public.vehicles(id), -- Veículo vinculado (se aplicável)
    
    -- Detalhes do item
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`subscription_payments`** - Histórico de pagamentos da assinatura
```sql
CREATE TABLE public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    
    -- Dados do pagamento
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status payment_status DEFAULT 'pending', -- pending, paid, failed, refunded
    
    -- Referência do pagamento
    billing_period_start DATE NOT NULL, -- Início do período cobrado
    billing_period_end DATE NOT NULL, -- Fim do período cobrado
    invoice_number TEXT, -- Número da nota fiscal/fatura
    
    -- Gateway de pagamento
    payment_gateway TEXT, -- 'stripe', 'asaas', 'mercadopago', etc
    payment_gateway_id TEXT, -- ID do pagamento no gateway
    payment_method TEXT,
    
    -- Metadados
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
```

**`subscription_history`** - Histórico de alterações na assinatura
```sql
CREATE TABLE public.subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
    
    -- Tipo de evento
    event_type TEXT NOT NULL, -- 'created', 'activated', 'paused', 'resumed', 'cancelled', 'renewed', 'payment_failed', 'payment_succeeded', 'plan_changed'
    
    -- Dados do evento
    description TEXT,
    old_value JSONB, -- Valor anterior (para mudanças)
    new_value JSONB, -- Novo valor
    
    -- Usuário que fez a ação
    user_id UUID REFERENCES public.profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Índices Necessários

```sql
CREATE INDEX idx_subscriptions_client ON public.subscriptions(client_id);
CREATE INDEX idx_subscriptions_owner ON public.subscriptions(owner_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX idx_subscription_payments_subscription ON public.subscription_payments(subscription_id);
CREATE INDEX idx_subscription_payments_status ON public.subscription_payments(status);
CREATE INDEX idx_subscription_payments_due_date ON public.subscription_payments(due_date);
CREATE INDEX idx_subscription_history_subscription ON public.subscription_history(subscription_id);
```

#### RLS Policies Necessárias

```sql
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

-- Subscription Items, Payments, History (seguem mesma lógica)
```

### 2.2 Frontend - Componentes Necessários

#### Páginas
- ❌ **`src/pages/Assinaturas.tsx`** - Página de gestão de assinaturas
- ❌ **`src/pages/NovaAssinatura.tsx`** - Criar nova assinatura
- ❌ **`src/pages/AssinaturaDetalhes.tsx`** - Detalhes de uma assinatura

#### Componentes
- ❌ **`src/components/subscriptions/SubscriptionTable.tsx`** - Tabela de assinaturas
- ❌ **`src/components/subscriptions/SubscriptionCard.tsx`** - Card de assinatura
- ❌ **`src/components/subscriptions/NewSubscriptionModal.tsx`** - Modal criar assinatura
- ❌ **`src/components/subscriptions/EditSubscriptionModal.tsx`** - Modal editar assinatura
- ❌ **`src/components/subscriptions/CancelSubscriptionDialog.tsx`** - Dialog cancelar
- ❌ **`src/components/subscriptions/SubscriptionStatusBadge.tsx`** - Badge de status
- ❌ **`src/components/subscriptions/PaymentHistory.tsx`** - Histórico de pagamentos
- ❌ **`src/components/subscriptions/SubscriptionItems.tsx`** - Itens da assinatura
- ❌ **`src/components/subscriptions/RenewalSettings.tsx`** - Configurações de renovação
- ❌ **`src/components/subscriptions/PaymentMethodForm.tsx`** - Form método de pagamento

### 2.3 Frontend - Hooks Necessários

- ❌ **`src/hooks/useSubscriptions.ts`**
  - `useSubscriptions()` - Lista assinaturas
  - `useSubscription(id)` - Busca assinatura específica
  - `useCreateSubscription()` - Cria assinatura
  - `useUpdateSubscription()` - Atualiza assinatura
  - `useCancelSubscription()` - Cancela assinatura
  - `usePauseSubscription()` - Pausa assinatura
  - `useResumeSubscription()` - Retoma assinatura
  - `useRenewSubscription()` - Renova assinatura manualmente

- ❌ **`src/hooks/useSubscriptionPayments.ts`**
  - `useSubscriptionPayments(subscriptionId)` - Lista pagamentos
  - `useRetryPayment()` - Tenta pagamento novamente
  - `useMarkPaymentAsPaid()` - Marca como pago manualmente

- ❌ **`src/hooks/useSubscriptionHistory.ts`**
  - `useSubscriptionHistory(subscriptionId)` - Histórico de eventos

### 2.4 Backend - Edge Functions Necessárias

- ❌ **`supabase/functions/create-subscription/index.ts`**
  - Cria assinatura
  - Valida dados
  - Cria primeiro pagamento
  - Registra histórico

- ❌ **`supabase/functions/process-subscription-payment/index.ts`**
  - Processa pagamento recorrente
  - Integra com gateway (Stripe/Asaas/etc)
  - Atualiza status
  - Cria registro financeiro
  - Envia notificações

- ❌ **`supabase/functions/cancel-subscription/index.ts`**
  - Cancela assinatura
  - Processa reembolsos se necessário
  - Registra histórico

- ❌ **`supabase/functions/renew-subscription/index.ts`**
  - Renova assinatura
  - Cria novo período de cobrança
  - Atualiza datas

### 2.5 Cron Jobs / Scheduled Functions

- ❌ **`supabase/functions/daily-subscription-check/index.ts`**
  - Executa diariamente (via cron)
  - Verifica assinaturas vencendo
  - Cria pagamentos pendentes
  - Processa renovações automáticas
  - Marca assinaturas expiradas

- ❌ **`supabase/functions/process-due-payments/index.ts`**
  - Executa diariamente
  - Processa pagamentos vencidos
  - Tenta cobrança automática
  - Envia notificações de falha

### 2.6 Integração com Gateway de Pagamento

#### Opções Recomendadas (Brasil)
- **Asaas** - Popular no Brasil, suporta cartão, PIX, boleto
- **Stripe** - Internacional, suporta cartão
- **Mercado Pago** - Popular, suporta múltiplos métodos
- **PagSeguro** - Popular no Brasil

#### Estrutura Necessária
- ❌ Tabela `payment_gateways` - Configurações dos gateways
- ❌ Edge Functions para webhooks dos gateways
- ❌ Tratamento de eventos (pagamento aprovado, recusado, etc)

### 2.7 Fluxo de Assinatura Proposto

```
1. Usuário cria assinatura para um cliente
   ↓
2. Seleciona produto/serviço, período, valor
   ↓
3. Configura método de pagamento
   ↓
4. Assinatura criada com status 'active'
   ↓
5. Primeiro pagamento criado (due_date = start_date)
   ↓
6. Cron job diário verifica pagamentos vencidos
   ↓
7. Processa pagamento via gateway
   ↓
8. Se sucesso:
   - Marca pagamento como 'paid'
   - Cria registro financeiro (receita)
   - Renova assinatura (se auto_renew = true)
   - Cria próximo pagamento
   ↓
9. Se falha:
   - Marca pagamento como 'failed'
   - Incrementa retry_count
   - Envia notificação
   - Após X tentativas, pausa assinatura
   ↓
10. Usuário pode cancelar/pausar a qualquer momento
```

---

## 🔗 PARTE 3: INTEGRAÇÃO ENTRE VENDAS E ASSINATURAS

### 3.1 Pontos de Integração

#### 3.1.1 Produtos como Assinaturas
- ❌ Adicionar campo `is_subscription` em `products`
- ❌ Se `is_subscription = true`, produto pode ser vendido como assinatura
- ❌ Na loja, produtos de assinatura têm botão "Assinar" ao invés de "Comprar"

#### 3.1.2 Vendas Únicas vs Assinaturas
- ✅ Vendas únicas: criam `equipment` imediatamente
- ❌ Assinaturas: criam `equipment` apenas quando primeiro pagamento é confirmado
- ❌ Assinaturas: podem ter múltiplos `equipment` ao longo do tempo

#### 3.1.3 Módulo Financeiro
- ✅ `finance_records` já existe para receitas/despesas
- ❌ Integrar pagamentos de assinatura com `finance_records`
- ❌ Quando pagamento de assinatura é pago, criar `finance_record` automaticamente

#### 3.1.4 Notificações
- ✅ Sistema de notificações já existe
- ❌ Notificar quando:
  - Assinatura criada
  - Pagamento vencendo (X dias antes)
  - Pagamento falhou
  - Assinatura renovada
  - Assinatura cancelada
  - Assinatura expirando

### 3.2 Relatórios e Dashboard

#### Relatórios Necessários
- ❌ Assinaturas ativas por período
- ❌ Taxa de renovação
- ❌ Taxa de cancelamento
- ❌ Receita recorrente (MRR - Monthly Recurring Revenue)
- ❌ Churn rate
- ❌ Pagamentos pendentes/falhados

#### Integração com Dashboard Existente
- ✅ Dashboard já tem `useMonthlyRevenue()`
- ❌ Adicionar receita de assinaturas separadamente
- ❌ Gráfico de assinaturas ativas ao longo do tempo

---

## 📝 PARTE 4: CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Estrutura Base (Banco de Dados)
- [ ] Criar migration com tabelas de assinaturas
- [ ] Criar enums necessários
- [ ] Criar índices
- [ ] Configurar RLS policies
- [ ] Criar funções auxiliares (se necessário)

### Fase 2: Backend (Edge Functions)
- [ ] `create-subscription` - Criar assinatura
- [ ] `process-subscription-payment` - Processar pagamento
- [ ] `cancel-subscription` - Cancelar assinatura
- [ ] `renew-subscription` - Renovar assinatura
- [ ] `daily-subscription-check` - Cron job diário
- [ ] `process-due-payments` - Processar pagamentos vencidos

### Fase 3: Integração Gateway de Pagamento
- [ ] Escolher gateway (Asaas/Stripe/etc)
- [ ] Criar tabela de configurações
- [ ] Implementar webhook handler
- [ ] Testar integração

### Fase 4: Frontend - Hooks
- [ ] `useSubscriptions.ts` - Hooks de assinaturas
- [ ] `useSubscriptionPayments.ts` - Hooks de pagamentos
- [ ] `useSubscriptionHistory.ts` - Hook de histórico

### Fase 5: Frontend - Componentes
- [ ] Página de assinaturas
- [ ] Tabela de assinaturas
- [ ] Modal criar/editar assinatura
- [ ] Dialog cancelar assinatura
- [ ] Histórico de pagamentos
- [ ] Configurações de renovação

### Fase 6: Integrações
- [ ] Integrar com `finance_records`
- [ ] Integrar com notificações
- [ ] Adicionar ao dashboard
- [ ] Integrar produtos como assinaturas

### Fase 7: Testes
- [ ] Testes unitários dos hooks
- [ ] Testes de integração das Edge Functions
- [ ] Testes E2E do fluxo completo
- [ ] Testes de cron jobs

---

## 🎯 PARTE 5: DECISÕES TÉCNICAS NECESSÁRIAS

### 5.1 Gateway de Pagamento
**Decisão necessária**: Qual gateway usar?
- **Asaas**: Popular no Brasil, boa documentação, suporta PIX/boleto/cartão
- **Stripe**: Internacional, mais caro, apenas cartão no Brasil
- **Mercado Pago**: Popular, múltiplos métodos

**Recomendação**: Asaas para mercado brasileiro

### 5.2 Estratégia de Cron Jobs
**Opções**:
1. Supabase Edge Functions com cron (se disponível)
2. Vercel Cron Jobs
3. Serviço externo (cron-job.org, etc)

**Recomendação**: Verificar disponibilidade de cron no Supabase, senão usar Vercel

### 5.3 Armazenamento de Tokens de Pagamento
**Decisão**: Como armazenar tokens sensíveis?
- **Opção 1**: Criptografar no banco
- **Opção 2**: Usar apenas IDs do gateway (mais seguro)
- **Opção 3**: Não armazenar, usar apenas IDs

**Recomendação**: Opção 2 ou 3 (apenas IDs do gateway)

### 5.4 Tratamento de Falhas de Pagamento
**Decisão**: Quantas tentativas antes de pausar?
- Tentativas: 3-5
- Intervalo entre tentativas: 3-7 dias
- Notificações: A cada falha

---

## 📚 PARTE 6: REFERÊNCIAS E DOCUMENTAÇÃO

### Arquivos Relacionados ao Sistema Atual

#### Banco de Dados
- `supabase/migrations/20251206164558_*.sql` - Migration principal
- `supabase/migrations/20251207111626_*.sql` - Product images

#### Frontend - Vendas
- `src/pages/Loja.tsx`
- `src/components/store/*`
- `src/hooks/useProducts.ts`
- `src/hooks/useOrders.ts`
- `src/types/product.ts`
- `src/types/cart.ts`

#### Backend - Vendas
- `supabase/functions/process-order/index.ts`

#### Financeiro
- `src/hooks/useFinance.ts`
- `src/components/finance/*`
- `src/types/finance.ts`

#### Notificações
- `src/hooks/useNotifications.ts`
- `src/components/notifications/*`

---

## ✅ RESUMO

### O que JÁ EXISTE
- ✅ Sistema completo de vendas de produtos
- ✅ Carrinho de compras
- ✅ Checkout com endereço e pagamento
- ✅ Processamento de pedidos
- ✅ Criação automática de equipamentos
- ✅ Gestão de estoque
- ✅ Módulo financeiro básico
- ✅ Sistema de notificações

### O que PRECISA SER CRIADO
- ❌ Sistema completo de assinaturas
- ❌ Tabelas de assinaturas, pagamentos, histórico
- ❌ Edge Functions para processar assinaturas
- ❌ Cron jobs para renovações automáticas
- ❌ Integração com gateway de pagamento
- ❌ Componentes frontend de assinaturas
- ❌ Hooks de assinaturas
- ❌ Relatórios de assinaturas
- ❌ Integração assinaturas ↔ finance_records
- ❌ Integração assinaturas ↔ notificações

---

**Última atualização**: 2025-01-XX
**Autor**: Mapeamento do sistema Alerta Veículos

