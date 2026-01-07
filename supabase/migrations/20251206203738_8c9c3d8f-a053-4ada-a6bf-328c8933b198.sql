-- Inserir permissões iniciais para os módulos do sistema

-- Módulo: Clientes
INSERT INTO public.permissions (code, name, module, description) VALUES
('clients_view', 'Visualizar', 'Clientes', 'Permite visualizar a lista de clientes'),
('clients_create', 'Criar', 'Clientes', 'Permite criar novos clientes'),
('clients_edit', 'Editar', 'Clientes', 'Permite editar dados de clientes'),
('clients_delete', 'Excluir', 'Clientes', 'Permite excluir clientes'),
('clients_billing', 'Cobranças', 'Clientes', 'Permite gerenciar cobranças de clientes'),
('clients_address', 'Endereço', 'Clientes', 'Permite gerenciar endereços de clientes'),
('clients_access', 'Acesso e opções', 'Clientes', 'Permite gerenciar acesso e opções de clientes'),
('clients_basic', 'Dados básicos', 'Clientes', 'Permite gerenciar dados básicos de clientes');

-- Módulo: Veículos
INSERT INTO public.permissions (code, name, module, description) VALUES
('vehicles_view', 'Visualizar', 'Veículos', 'Permite visualizar a lista de veículos'),
('vehicles_create', 'Criar', 'Veículos', 'Permite criar novos veículos'),
('vehicles_edit', 'Editar', 'Veículos', 'Permite editar dados de veículos'),
('vehicles_delete', 'Excluir', 'Veículos', 'Permite excluir veículos'),
('vehicles_block', 'Bloquear', 'Veículos', 'Permite bloquear e desbloquear veículos'),
('vehicles_track', 'Rastrear', 'Veículos', 'Permite visualizar rastreamento em tempo real'),
('vehicles_alerts', 'Alertas', 'Veículos', 'Permite gerenciar alertas de veículos');

-- Módulo: Financeiro
INSERT INTO public.permissions (code, name, module, description) VALUES
('finance_view', 'Visualizar', 'Financeiro', 'Permite visualizar registros financeiros'),
('finance_revenue', 'Receitas', 'Financeiro', 'Permite gerenciar receitas'),
('finance_expenses', 'Despesas', 'Financeiro', 'Permite gerenciar despesas'),
('finance_reports', 'Relatórios', 'Financeiro', 'Permite visualizar relatórios financeiros'),
('finance_edit', 'Editar', 'Financeiro', 'Permite editar registros financeiros'),
('finance_delete', 'Excluir', 'Financeiro', 'Permite excluir registros financeiros');

-- Módulo: Estoque
INSERT INTO public.permissions (code, name, module, description) VALUES
('stock_view', 'Visualizar', 'Estoque', 'Permite visualizar equipamentos em estoque'),
('stock_create', 'Criar', 'Estoque', 'Permite adicionar novos equipamentos'),
('stock_edit', 'Editar', 'Estoque', 'Permite editar dados de equipamentos'),
('stock_delete', 'Excluir', 'Estoque', 'Permite excluir equipamentos'),
('stock_install', 'Instalar', 'Estoque', 'Permite instalar equipamentos em veículos'),
('stock_maintenance', 'Manutenção', 'Estoque', 'Permite gerenciar manutenção de equipamentos');

-- Módulo: Loja
INSERT INTO public.permissions (code, name, module, description) VALUES
('store_view', 'Visualizar', 'Loja', 'Permite visualizar produtos da loja'),
('store_create', 'Criar', 'Loja', 'Permite criar novos produtos'),
('store_edit', 'Editar', 'Loja', 'Permite editar produtos'),
('store_delete', 'Excluir', 'Loja', 'Permite excluir produtos'),
('store_purchase', 'Comprar', 'Loja', 'Permite realizar compras na loja'),
('store_orders', 'Pedidos', 'Loja', 'Permite gerenciar pedidos');

-- Módulo: Notificações
INSERT INTO public.permissions (code, name, module, description) VALUES
('notifications_view', 'Visualizar', 'Notificações', 'Permite visualizar notificações'),
('notifications_create', 'Criar', 'Notificações', 'Permite criar notificações'),
('notifications_send', 'Enviar', 'Notificações', 'Permite enviar notificações para usuários');

-- Módulo: Configurações
INSERT INTO public.permissions (code, name, module, description) VALUES
('settings_view', 'Visualizar', 'Configurações', 'Permite visualizar configurações'),
('settings_roles', 'Funções', 'Configurações', 'Permite gerenciar funções administrativas'),
('settings_permissions', 'Permissões', 'Configurações', 'Permite gerenciar permissões'),
('settings_users', 'Usuários', 'Configurações', 'Permite gerenciar usuários do sistema');

-- Módulo: Dashboard
INSERT INTO public.permissions (code, name, module, description) VALUES
('dashboard_view', 'Visualizar', 'Dashboard', 'Permite visualizar o dashboard'),
('dashboard_stats', 'Estatísticas', 'Dashboard', 'Permite visualizar estatísticas detalhadas'),
('dashboard_reports', 'Relatórios', 'Dashboard', 'Permite gerar relatórios do dashboard');