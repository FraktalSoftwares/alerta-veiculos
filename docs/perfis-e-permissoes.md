# Perfis de acesso — o que cada um vê e faz (sistema web)

> Documento gerado a partir da análise do código (`src/`). Descreve os **7 tipos de usuário** (`profiles.user_type`): **Administrador, Associação, Associado, Franquia, Franqueado, Frotista, Motorista**.

## Como o acesso funciona (2 camadas independentes)

O controle de acesso combina **dois eixos**:

1. **Tipo de usuário (`user_type`)** — define **o que a pessoa enxerga** (escopo de dados, via hierarquia `parent_client_id`) e algumas **regras estruturais** (ex.: Configurações é só de Administrador). É a "posição" da pessoa na árvore.
2. **Permissões (função/role)** — definem **quais telas e ações** ficam disponíveis. Cada usuário tem **uma função** (`admin_roles`) com um conjunto de permissões (`role_permissions`). O **menu e as rotas** aparecem/liberam conforme essas permissões.

> **Administrador é exceção:** ignora a checagem de permissões e vê **tudo** (`useUserPermissions` / `ProtectedByPermission`).

### Hierarquia (quem fica sob quem)

```
Administrador (topo, sem dono)
├── Associação ──> cria: Associado, Motorista
│     └── Associado (subordinado)
├── Franquia ────> cria: Franqueado, Motorista
│     └── Franqueado (subordinado)
└── Frotista ────> cria: Motorista
      └── Motorista (subordinado)
```

- **Gestores** (criam sub-usuários e agregam os dados dos descendentes): **Administrador, Associação, Franquia, Frotista**.
- **Subordinados** (não criam ninguém): **Associado, Franqueado, Motorista**.
- **Escopo de dados:** cada gestor enxerga **a si + todos os descendentes** (via `parent_client_id`); subordinados enxergam **o próprio escopo**. O **Motorista é caso especial**: só vê os **veículos do cliente ao qual está vinculado**.
- O escopo de linhas é garantido principalmente pelo **RLS do Supabase**; o front-end reforça em alguns pontos (veículos do motorista, clientes por hierarquia, financeiro por dono).

---

## Telas do sistema (referência)

> **Regra reforçada por tipo (estrutural):** além da permissão, algumas telas são **bloqueadas por `user_type`** (no menu, na rota e no redirecionamento de login) — assim não vazam mesmo que a função conceda a permissão. Colunas abaixo.

| Tela | Rota | Permissão exigida | Restrição por tipo (estrutural) |
|------|------|-------------------|--------------------|
| Início / Dashboard | `/` | `dashboard_view` | **Todos, menos Motorista** |
| Clientes | `/clientes`, `/clientes/:id` | `clients_view` | **Só gestores** (Admin, Associação, Franquia, Frotista) |
| Veículos (gestão) | `/veiculos` | `vehicles_view` | — (todos) |
| Mapa (gestão de mapa) | `/veiculos/mapa`, `/veiculos/:id/mapa` | `vehicles_track` | — (todos) |
| Histórico do veículo | `/veiculos/:id/historico` | `vehicles_view` | — (todos) |
| Cercas virtuais | `/veiculos/:id/cercas` | `vehicles_view` | — (todos) |
| Rotas obrigatórias | `/veiculos/:id/rotas` | `vehicles_view` | — (todos) |
| Notificações | `/notificacoes` | `notifications_view` | — (todos) |
| Financeiro (receitas) | `/financeiro` | `finance_view` | **Só gestores** |
| Financeiro (despesas) | `/financeiro/despesas` | `finance_expenses` | **Só gestores** |
| Loja | `/loja` | `store_view` | **Só Admin, Associação, Franquia** |
| Meus Pedidos | `/meus-pedidos` | `store_view` | **Só Admin, Associação, Franquia** |
| Estoque | `/estoque` | `stock_view` | **Só gestores** (coluna "Proprietário" só Admin) |
| Assinaturas | `/assinaturas` | `finance_view` | — |
| Perfil | `/perfil` | nenhuma (só estar logado) | — (todos) |
| **Configurações → Funções** | `/configuracoes` | `settings_view` | **Somente Administrador** |
| **Configurações → Usuários** | `/configuracoes/usuarios` | `settings_users` | **Somente Administrador** |

> **Gestores** = Admin, Associação, Franquia, Frotista. **Subordinados** = Associado, Franqueado, Motorista.
> **`/perfil`** é o fallback universal: qualquer usuário logado acessa. Um usuário **sem nenhuma permissão** cai direto no Perfil.
> **E-mail (login) é read-only** na edição de Perfil e de Cliente — ninguém (nem Admin) altera após o cadastro.

**Telas públicas (sem login):** login, esqueci a senha, nova senha, compartilhamento público de mapa (`/compartilhar/:id`), relatório PDF, política de privacidade, termos de uso.

---

## Por perfil

> **Importante:** para os tipos **não-admin**, as telas efetivamente visíveis dependem da **função (role) atribuída** à pessoa, configurada pelo Administrador em *Configurações → Funções/Usuários*. O sistema atribui uma **função padrão por tipo** ao criar o acesso do cliente (mapa de roles padrão em `NewClientModal` / edge function `create-client-user`), mas o **conteúdo exato dessas funções vive no banco** (`role_permissions`) e não no código. Abaixo está o **acesso esperado/estrutural** por perfil; a lista fina de permissões é ajustável por função.

### 1. Administrador
- **Papel:** topo da hierarquia, sem cliente próprio. Administra o sistema inteiro.
- **Enxerga:** **tudo** — todos os clientes, veículos, financeiro, estoque e loja, sem limite de escopo. Na tela de Clientes vê o **topo da árvore** (associações, franquias, frotistas) e navega para os descendentes.
- **Telas/ações:** **todas** — ignora a checagem de permissões. Único que acessa **Configurações** (criar/editar **Funções** e **Usuários**, atribuir permissões). Vê fatias extras no Dashboard ("Associações", "Na Loja") e a coluna "Proprietário" no Estoque.
- **Pode criar:** **todos os tipos** (admin, associação, associado, franquia, franqueado, frotista, motorista).
- **Personalização de marca/tema:** usa o **tema padrão** do sistema (não personaliza um cliente).
- **Conta:** nunca é bloqueada por `is_active`.

### 2. Associação  *(gestor)*
- **Papel:** entidade-pai que agrupa **Associados** e **Motoristas**.
- **Enxerga:** a si + **todos os seus descendentes** (associados e motoristas e os veículos deles), via hierarquia `parent_client_id`. Financeiro filtrado pelo próprio dono.
- **Telas/ações (esperado):** Início, **Clientes** (seus associados), **Veículos + Mapa**, **Notificações**, **Financeiro**, **Loja** (com **carrinho/compra** — é comprador), **Estoque**, **Assinaturas**, Perfil — conforme as permissões da função. **Não** acessa Configurações.
- **Pode criar:** **Associado, Motorista**.
- **Personalização:** **sim** — define tema/cor/logo/favicon (herdado pelos subordinados).

### 3. Associado  *(subordinado)*
- **Papel:** cliente sob uma Associação. Não gerencia outros usuários.
- **Enxerga:** o **próprio escopo** (seus veículos). Herda tema/marca da Associação-pai.
- **Telas/ações (esperado):** foco em **Veículos + Mapa**, **Notificações** e **Perfil** (histórico, cercas, rotas e detalhes dos seus veículos). Dashboard, quando disponível, é o **resumo simplificado**. Na Loja é **apenas visualização** (não tem carrinho/compra). **Não** acessa Configurações nem Clientes de terceiros.
- **Pode criar:** **ninguém**.
- **Personalização:** **não** (herda do pai).

### 4. Franquia  *(gestor)*
- **Papel:** entidade-pai que agrupa **Franqueados** e **Motoristas**.
- **Enxerga:** a si + **todos os descendentes** (franqueados, motoristas e veículos), via `parent_client_id`. Financeiro pelo próprio dono.
- **Telas/ações (esperado):** igual à Associação — Início, **Clientes** (seus franqueados), **Veículos + Mapa**, **Notificações**, **Financeiro**, **Loja com compra** (é comprador), **Estoque**, **Assinaturas**, Perfil. **Não** acessa Configurações.
- **Pode criar:** **Franqueado, Motorista**.
- **Personalização:** **sim**.

### 5. Franqueado  *(subordinado)*
- **Papel:** cliente sob uma Franquia. Não gerencia outros usuários.
- **Enxerga:** o **próprio escopo** (seus veículos). Herda tema/marca da Franquia-pai.
- **Telas/ações (esperado):** como o **Associado** — **Veículos + Mapa**, **Notificações**, **Perfil**; Loja só visualização; Dashboard simplificado quando houver. Sem Configurações.
- **Pode criar:** **ninguém**.
- **Personalização:** **não** (herda do pai).

### 6. Frotista  *(gestor)*
- **Papel:** dono de frota que cadastra **Motoristas** para seus veículos.
- **Enxerga:** a si + **seus motoristas** e a **frota** (veículos), via `parent_client_id`. Financeiro pelo próprio dono.
- **Telas/ações (esperado):** Início, **Veículos + Mapa**, **Notificações**, **Financeiro**, **Estoque**, **Assinaturas**, Perfil, e (se a função permitir) **Clientes** com seus motoristas. Na **Loja** aparece como **visualização** (o carrinho/compra é liberado só para Associação e Franquia). **Não** acessa Configurações.
- **Pode criar:** **Motorista**.
- **Personalização:** **sim**.

### 7. Motorista  *(subordinado — caso especial)*
- **Papel:** condutor vinculado a um cliente (Associação, Franquia ou Frotista).
- **Enxerga:** **apenas os veículos do cliente ao qual está vinculado** (regra específica no front-end, além do RLS). Não vê financeiro/estoque/loja como gestor.
- **Telas/ações (esperado):** **Veículos + Mapa** (acompanhar a frota que dirige), **Notificações** e **Perfil**. O item **Configurações some** para o motorista até no menu de perfil. Sem Dashboard de gestão, sem Clientes.
- **Pode criar:** **ninguém**.
- **Personalização:** **não** (herda do pai).

---

## Resumo rápido

Legenda de telas: **Dash** = Início/Dashboard · **Cli** = Clientes · **Veíc** = Veículos+Mapa · **Notif** = Notificações · **Fin** = Financeiro · **Loja** · **Est** = Estoque · **Config** = Configurações.

| Perfil | Cria | Personaliza | Escopo de dados | Dash | Cli | Veíc | Notif | Fin | Loja | Est | Config |
|--------|:---:|:---:|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Administrador** | Todos | tema padrão | Tudo | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Associação** | Associado, Motorista | ✅ | Si + descendentes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Associado** | — | ❌ (herda) | Próprio | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Franquia** | Franqueado, Motorista | ✅ | Si + descendentes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Franqueado** | — | ❌ (herda) | Próprio | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Frotista** | Motorista | ✅ | Si + frota/motoristas | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Motorista** | — | ❌ (herda) | Veículos do cliente vinculado | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

> **Loja:** só Admin, Associação e Franquia (com carrinho/compra). **Financeiro/Estoque/Clientes:** só gestores. **Dashboard:** todos menos Motorista.

---

## Observações / limitações desta análise

- **A lista fina de permissões por função padrão não está no repositório.** O sistema atribui uma função padrão a cada tipo ao criar o acesso, mas **quais permissões** cada função concede está no banco (`role_permissions`), não no código. Para a matriz exata "tela × função", é preciso inspecionar o banco (ou a tela *Configurações → Funções*, como Administrador). Este documento descreve o **acesso estrutural/esperado**; ajustes finos são feitos por função.
- **O escopo real de dados depende do RLS do Supabase.** Vários painéis leem dados confiando no RLS; as políticas de RLS não estão versionadas neste repositório.
- **Telas de veículos** (histórico, cercas, rotas, mapa) exigem `vehicles_view`/`vehicles_track`; ações como **bloquear/desbloquear** dependem de `vehicles_block`/`vehicles_edit`.
- Divergência técnica menor: alguns tipos TypeScript de `user_type` no front (`AuthContext`, `ProtectedRoute`) omitem `'franquia'` da união — não quebra em runtime (comparação por string), mas vale corrigir.
</content>
