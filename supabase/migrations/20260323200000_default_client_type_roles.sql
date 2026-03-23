-- =============================================
-- Criar funções administrativas padrão para cada tipo de cliente
-- Cada função tem permissões adequadas ao seu nível de acesso
-- =============================================

-- Função: Associação (acesso amplo, quase tudo)
INSERT INTO public.admin_roles (id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000002', 'Associação', 'Função padrão para clientes do tipo Associação', true)
ON CONFLICT (id) DO NOTHING;

-- Função: Franqueado (acesso similar à associação)
INSERT INTO public.admin_roles (id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000003', 'Franqueado', 'Função padrão para clientes do tipo Franqueado', true)
ON CONFLICT (id) DO NOTHING;

-- Função: Frotista (gerencia veículos e visualiza financeiro)
INSERT INTO public.admin_roles (id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000004', 'Frotista', 'Função padrão para clientes do tipo Frotista', true)
ON CONFLICT (id) DO NOTHING;

-- Função: Motorista (apenas visualização e rastreamento)
INSERT INTO public.admin_roles (id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000005', 'Motorista', 'Função padrão para motoristas', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Atribuir permissões por função
-- =============================================

-- ASSOCIAÇÃO: quase tudo (exceto configurações de sistema)
INSERT INTO public.role_permissions (admin_role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id
FROM public.permissions
WHERE code IN (
  'dashboard_view', 'dashboard_stats', 'dashboard_reports',
  'clients_view', 'clients_create', 'clients_edit', 'clients_delete',
  'clients_billing', 'clients_address', 'clients_access', 'clients_basic',
  'vehicles_view', 'vehicles_create', 'vehicles_edit', 'vehicles_delete',
  'vehicles_block', 'vehicles_track', 'vehicles_alerts',
  'finance_view', 'finance_revenue', 'finance_expenses', 'finance_reports',
  'finance_edit', 'finance_delete',
  'stock_view', 'stock_create', 'stock_edit', 'stock_delete',
  'stock_install', 'stock_maintenance',
  'store_view', 'store_purchase', 'store_orders',
  'notifications_view', 'notifications_create', 'notifications_send',
  'settings_view', 'settings_roles', 'settings_permissions', 'settings_users'
)
ON CONFLICT DO NOTHING;

-- FRANQUEADO: similar à associação
INSERT INTO public.role_permissions (admin_role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000003', id
FROM public.permissions
WHERE code IN (
  'dashboard_view', 'dashboard_stats', 'dashboard_reports',
  'clients_view', 'clients_create', 'clients_edit',
  'clients_billing', 'clients_address', 'clients_access', 'clients_basic',
  'vehicles_view', 'vehicles_create', 'vehicles_edit', 'vehicles_delete',
  'vehicles_block', 'vehicles_track', 'vehicles_alerts',
  'finance_view', 'finance_revenue', 'finance_expenses', 'finance_reports',
  'finance_edit',
  'stock_view', 'stock_create', 'stock_edit',
  'stock_install', 'stock_maintenance',
  'store_view', 'store_purchase', 'store_orders',
  'notifications_view', 'notifications_create', 'notifications_send',
  'settings_view', 'settings_users'
)
ON CONFLICT DO NOTHING;

-- FROTISTA: gerencia veículos, visualiza financeiro
INSERT INTO public.role_permissions (admin_role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id
FROM public.permissions
WHERE code IN (
  'dashboard_view', 'dashboard_stats',
  'clients_view',
  'vehicles_view', 'vehicles_create', 'vehicles_edit',
  'vehicles_track', 'vehicles_alerts',
  'finance_view', 'finance_revenue',
  'stock_view',
  'store_view', 'store_purchase',
  'notifications_view'
)
ON CONFLICT DO NOTHING;

-- MOTORISTA: apenas visualização e rastreamento
INSERT INTO public.role_permissions (admin_role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000005', id
FROM public.permissions
WHERE code IN (
  'dashboard_view',
  'vehicles_view', 'vehicles_track', 'vehicles_alerts',
  'notifications_view'
)
ON CONFLICT DO NOTHING;
