# Arquitetura do Sistema - Alerta Veículos

## 🏗️ Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React Application (Frontend)             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │  Pages   │  │Components│  │  Hooks   │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ Contexts │  │   Types  │  │   Utils  │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE (Backend)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              PostgreSQL Database                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ Profiles │  │ Clients  │  │ Vehicles │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │ Products │  │  Orders  │  │ Finance  │          │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Supabase Auth                            │   │
│  │  - Authentication                                     │   │
│  │  - Authorization                                      │   │
│  │  - Session Management                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Edge Functions (Deno)                    │   │
│  │  - create-user                                        │   │
│  │  - create-client-user                                 │   │
│  │  - process-order                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Storage                                  │   │
│  │  - Product Images                                     │   │
│  │  - User Avatars                                       │   │
│  │  - Client Logos                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ API Integration
                            │
┌─────────────────────────────────────────────────────────────┐
│                  SERVIÇOS EXTERNOS                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Google Maps API                          │   │
│  │  - Map Visualization                                 │   │
│  │  - Geocoding                                         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              GPS Tracking Devices                     │   │
│  │  - Vehicle Tracking Data                             │   │
│  │  - Real-time Updates                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Estrutura de Camadas

### 1. Camada de Apresentação (Frontend)

```
src/
├── pages/              # Rotas da aplicação
│   ├── Index.tsx       # Dashboard
│   ├── Login.tsx       # Autenticação
│   ├── Clientes.tsx    # Lista de clientes
│   ├── Veiculos.tsx    # Lista de veículos
│   └── ...
│
├── components/         # Componentes React
│   ├── ui/             # Componentes base (shadcn)
│   ├── layout/         # Layout e navegação
│   ├── auth/           # Autenticação
│   ├── clients/        # Gestão de clientes
│   ├── vehicles/       # Gestão de veículos
│   ├── dashboard/      # Dashboard
│   ├── finance/        # Módulo financeiro
│   ├── store/          # Loja
│   └── ...
│
├── hooks/              # Custom hooks
│   ├── useClients.ts
│   ├── useVehicles.ts
│   ├── useDashboard.ts
│   └── ...
│
├── contexts/           # React Contexts
│   └── AuthContext.tsx
│
├── lib/                # Utilitários
│   ├── utils.ts
│   ├── formatters.ts
│   └── validations/
│
└── types/              # TypeScript types
    ├── client.ts
    ├── vehicle.ts
    └── ...
```

### 2. Camada de Integração

```
src/integrations/
└── supabase/
    ├── client.ts       # Cliente Supabase
    └── types.ts        # Tipos gerados do DB
```

### 3. Camada de Backend (Supabase)

```
supabase/
├── migrations/         # Migrações SQL
│   ├── 20251206_*.sql
│   └── ...
│
└── functions/         # Edge Functions
    ├── create-user/
    ├── create-client-user/
    └── process-order/
```

---

## 🔄 Fluxo de Dados

### Fluxo de Autenticação

```
1. Usuário faz login
   ↓
2. AuthContext.signIn()
   ↓
3. Supabase Auth API
   ↓
4. Session criada
   ↓
5. AuthContext atualiza estado
   ↓
6. Profile carregado do DB
   ↓
7. Usuário redirecionado
```

### Fluxo de Consulta de Dados

```
1. Componente renderiza
   ↓
2. Hook customizado (ex: useVehicles)
   ↓
3. React Query (TanStack Query)
   ↓
4. Verifica cache
   ↓
5. Se não em cache → Supabase Client
   ↓
6. Query no PostgreSQL
   ↓
7. Dados retornados
   ↓
8. Cache atualizado
   ↓
9. Componente re-renderiza
```

### Fluxo de Mutação

```
1. Usuário executa ação (ex: criar cliente)
   ↓
2. Hook de mutation (ex: useCreateClient)
   ↓
3. Supabase Client.insert()
   ↓
4. PostgreSQL executa INSERT
   ↓
5. Dados retornados
   ↓
6. React Query invalida cache
   ↓
7. Queries relacionadas refetch
   ↓
8. UI atualiza automaticamente
```

---

## 🔐 Sistema de Autenticação e Autorização

### Hierarquia de Usuários

```
admin
  └── associacao
      └── franqueado
          └── frotista
              └── motorista
```

### Proteção de Rotas

```
Route Component
    ↓
ProtectedRoute
    ↓
Verifica autenticação (user?)
    ↓
Verifica permissões (user_type?)
    ↓
Renderiza componente ou redireciona
```

### Row Level Security (RLS)

```
PostgreSQL Policies
    ↓
Verifica owner_id
    ↓
Verifica hierarquia
    ↓
Permite/nega acesso
```

---

## 📊 Estrutura do Banco de Dados

### Relacionamentos Principais

```
profiles (usuários)
    │
    ├── clients (clientes)
    │   ├── addresses
    │   ├── secondary_contacts
    │   ├── billing_settings
    │   └── client_customization
    │
    └── vehicles (veículos)
        ├── vehicle_tracking_data
        ├── vehicle_alerts
        └── equipment

clients
    └── orders (pedidos)
        └── order_items
            └── products

clients
    └── finance_transactions
```

### Tabelas Core

1. **profiles** - Perfis de usuários
2. **clients** - Clientes (hierárquico)
3. **vehicles** - Veículos
4. **equipment** - Equipamentos de rastreamento
5. **products** - Produtos da loja
6. **orders** - Pedidos
7. **finance_transactions** - Transações financeiras

---

## 🎨 Padrões de Design Utilizados

### 1. Container/Presentational Pattern
- **Container:** Páginas e componentes principais
- **Presentational:** Componentes UI reutilizáveis

### 2. Custom Hooks Pattern
- Lógica de negócio abstraída em hooks
- Reutilização de lógica entre componentes

### 3. Context API Pattern
- Estado global de autenticação
- Evita prop drilling

### 4. React Query Pattern
- Cache automático
- Sincronização de dados
- Otimistic updates

### 5. Compound Components
- Componentes shadcn/ui
- Composição flexível

---

## 🔌 Integrações Externas

### Google Maps API
- **Uso:** Visualização de mapas
- **Componentes:** `VehicleMap`, `VehiclesMap`
- **Dados:** Coordenadas de rastreamento

### Supabase Services
- **Auth:** Autenticação e autorização
- **Database:** PostgreSQL com RLS
- **Storage:** Arquivos e imagens
- **Edge Functions:** Lógica serverless

---

## 🚀 Fluxo de Deploy

```
1. Desenvolvimento Local
   npm run dev
   ↓
2. Build
   npm run build
   ↓
3. Preview
   npm run preview
   ↓
4. Deploy (Vercel/Plataforma)
   ↓
5. Produção
```

---

## 📈 Escalabilidade

### Atual
- ✅ Arquitetura modular
- ✅ Separação de concerns
- ✅ Componentes reutilizáveis

### Futuro
- 🔄 Code splitting por rota
- 🔄 Lazy loading de componentes
- 🔄 Cache de queries
- 🔄 CDN para assets
- 🔄 Microserviços (se necessário)

---

## 🔒 Segurança

### Frontend
- ✅ Validação de formulários (Zod)
- ✅ Sanitização de inputs
- ✅ Proteção de rotas

### Backend
- ✅ Row Level Security (RLS)
- ✅ Validação de hierarquia
- ✅ Edge Functions com validação
- ✅ CORS configurado

### Autenticação
- ✅ JWT tokens (Supabase)
- ✅ Refresh tokens automático
- ✅ Session management

---

## 📝 Notas de Arquitetura

1. **Monorepo:** Tudo em um único repositório
2. **BaaS:** Supabase como backend completo
3. **Type Safety:** TypeScript em todo o projeto
4. **State Management:** React Query + Context API
5. **UI Framework:** shadcn/ui (componentes acessíveis)
6. **Build Tool:** Vite (rápido e moderno)

---

*Documento atualizado em: Dezembro 2024*

