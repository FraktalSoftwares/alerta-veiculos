# 🚗 Alerta Veículos

Sistema completo de rastreamento e gestão de veículos com dashboard, controle financeiro e loja integrada.

## 📋 Sobre o Projeto

O **Alerta Veículos** é uma plataforma web full-stack desenvolvida para gerenciar frotas de veículos, clientes, equipamentos de rastreamento, finanças e estoque. O sistema oferece rastreamento em tempo real, visualização em mapas, gestão hierárquica de clientes e usuários, além de módulos completos de financeiro e e-commerce.

## ✨ Funcionalidades Principais

### 🔐 Autenticação e Autorização
- Sistema de login/logout com Supabase Auth
- Hierarquia de 5 níveis de usuários (Admin → Associacao → Franqueado → Frotista → Motorista)
- Recuperação de senha
- Proteção de rotas baseada em permissões granulares

### 👥 Gestão de Clientes
- CRUD completo de clientes
- Hierarquia de clientes (espelha hierarquia de usuários)
- Múltiplos endereços por cliente
- Contatos secundários
- Configurações de cobrança personalizadas
- Customização white-label por cliente
- Estatísticas de veículos por cliente (total, rastreados, sem sinal, desligados)

### 🚙 Rastreamento de Veículos
- Cadastro e gestão completa de veículos
- Integração com equipamentos de rastreamento (IMEI, serial number)
- Visualização em tempo real no mapa (Google Maps)
- Histórico de rastreamento detalhado
- Status de veículos (rastreando, desligado, sem sinal, bloqueado, manutenção)
- Alertas e notificações de veículos
- Dados de rastreamento (localização, velocidade, direção, ignição)

### 📊 Dashboard e Analytics
- Estatísticas em tempo real de clientes, veículos e estoque
- Gráficos de receita e despesas
- Cards de resumo com métricas importantes
- Filtros por período (data inicial e final)

### 💰 Módulo Financeiro
- Gestão de receitas e despesas
- Status de pagamento (pendente, pago, vencido, cancelado)
- Relatórios financeiros
- Controle de inadimplência

### 🛒 Loja e Estoque
- Catálogo completo de produtos
- Gestão de estoque em tempo real
- Carrinho de compras
- Processamento de pedidos
- Status de pedidos (pendente, aprovado, enviado, entregue, cancelado)
- Gestão de equipamentos (rastreadores)

### 🔔 Sistema de Notificações
- Notificações por tipo de usuário
- Alertas de veículos em tempo real
- Drawer de alertas acessível

### ⚙️ Configurações
- Gestão de usuários e permissões
- Configurações do sistema
- Perfil do usuário e alteração de senha

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18.3.1** - Biblioteca JavaScript para interfaces
- **TypeScript 5.8.3** - Superset JavaScript com tipagem estática
- **Vite 5.4.19** - Build tool rápida e moderna
- **React Router DOM 6.30.1** - Roteamento
- **TanStack Query 5.83.0** - Gerenciamento de estado servidor e cache
- **shadcn/ui** - Componentes UI acessíveis baseados em Radix UI
- **Tailwind CSS 3.4.17** - Framework CSS utility-first
- **React Hook Form 7.61.1** - Gerenciamento de formulários
- **Zod 3.25.76** - Validação de schemas
- **Recharts 2.15.4** - Gráficos e visualizações
- **Google Maps API** - Mapas e rastreamento
- **Lucide React** - Biblioteca de ícones

### Backend
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL - Banco de dados relacional
  - Supabase Auth - Autenticação
  - Row Level Security (RLS) - Segurança em nível de linha
  - Edge Functions - Funções serverless em TypeScript
  - Storage - Armazenamento de arquivos

### Ferramentas de Desenvolvimento
- **ESLint** - Linting de código
- **Vitest** - Framework de testes
- **TypeScript** - Tipagem estática

## 📁 Estrutura do Projeto

```
alerta-veiculos/
├── src/
│   ├── components/          # Componentes React organizados por módulo
│   │   ├── auth/           # Autenticação e proteção de rotas
│   │   ├── clients/        # Gestão de clientes
│   │   ├── dashboard/      # Dashboard e estatísticas
│   │   ├── finance/        # Módulo financeiro
│   │   ├── layout/         # Layout e navegação
│   │   ├── notifications/  # Sistema de notificações
│   │   ├── profile/        # Perfil do usuário
│   │   ├── settings/       # Configurações
│   │   ├── stock/          # Gestão de estoque
│   │   ├── store/          # Loja/e-commerce
│   │   ├── ui/             # Componentes UI reutilizáveis (shadcn)
│   │   └── vehicles/       # Gestão de veículos e rastreamento
│   ├── contexts/           # React Contexts (AuthContext)
│   ├── hooks/              # Custom hooks (17 hooks customizados)
│   ├── integrations/       # Integrações externas (Supabase)
│   ├── lib/                # Utilitários e helpers
│   ├── pages/              # Páginas/rotas da aplicação
│   └── types/              # Definições TypeScript
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # Migrações do banco de dados
└── public/                 # Assets estáticos
```

## 🚀 Como Começar

### Pré-requisitos

- Node.js 18+ (recomendado usar [nvm](https://github.com/nvm-sh/nvm))
- npm ou yarn
- Conta no Supabase
- Chave da API do Google Maps (para funcionalidade de mapas)

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/FraktalSoftwares/alerta-veiculos.git
cd alerta-veiculos
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_GOOGLE_MAPS_API_KEY=sua_chave_do_google_maps
```

4. **Execute as migrações do banco de dados**

Certifique-se de que todas as migrações em `supabase/migrations/` foram aplicadas no seu projeto Supabase.

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## 📜 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run build:dev` - Cria build de desenvolvimento
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa o linter
- `npm test` - Executa os testes
- `npm run test:ui` - Executa testes com interface
- `npm run test:coverage` - Executa testes com cobertura

## 🗄️ Banco de Dados

O projeto utiliza Supabase (PostgreSQL) com as seguintes tabelas principais:

- `profiles` - Perfis de usuários
- `user_roles` - Roles administrativas
- `clients` - Clientes (hierárquico)
- `addresses` - Endereços de clientes
- `vehicles` - Veículos
- `vehicle_tracking_data` - Histórico de rastreamento
- `vehicle_alerts` - Alertas de veículos
- `equipment` - Equipamentos de rastreamento
- `products` - Produtos da loja
- `orders` - Pedidos
- `finance_transactions` - Transações financeiras
- `notifications` - Notificações do sistema

## 🔒 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Autenticação via Supabase Auth
- Proteção de rotas baseada em permissões
- Validação de dados com Zod
- TypeScript para type safety

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é propriedade da Fraktal Softwares.

## 👥 Desenvolvido por

**Fraktal Softwares**

---

Para mais informações, consulte a documentação em:
- [Análise do Projeto](./ANALISE_PROJETO.md)
- [Arquitetura](./ARQUITETURA.md)
- [Resumo Executivo](./RESUMO_EXECUTIVO.md)
