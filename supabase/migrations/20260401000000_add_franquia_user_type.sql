-- =============================================
-- Adicionar tipo de usuário 'franquia' ao enum user_type
-- Hierarquia:
--   admin: pode tudo (master)
--   associacao: cadastra associado, motorista, veículos, compra equipamentos
--   associado: visualização apenas (definido pela associação)
--   franquia: cadastra franqueado, motorista, veículos, compra equipamentos
--   franqueado: visualização apenas (definido pela franquia)
--   frotista: cadastra motorista, veículos
--   motorista: visualiza seus veículos
-- =============================================

-- Adicionar 'franquia' ao enum user_type
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'franquia' BEFORE 'franqueado';

-- =============================================
-- Criar função administrativa padrão para Franquia
-- =============================================

INSERT INTO public.admin_roles (id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000006', 'Franquia', 'Função padrão para clientes do tipo Franquia', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Criar função administrativa padrão para Associado (visualização)
-- =============================================

INSERT INTO public.admin_roles (id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000007', 'Associado', 'Função padrão para clientes do tipo Associado (visualização)', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- Criar função administrativa padrão para Franqueado (visualização)
-- =============================================

INSERT INTO public.admin_roles (id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000008', 'Franqueado', 'Função padrão para clientes do tipo Franqueado (visualização)', true)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- FRANQUIA: similar à Associação (cadastra, gerencia, compra)
-- =============================================

INSERT INTO public.role_permissions (admin_role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000006', id
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

-- =============================================
-- ASSOCIADO: visualização apenas (definido pela associação)
-- =============================================

INSERT INTO public.role_permissions (admin_role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000007', id
FROM public.permissions
WHERE code IN (
  'dashboard_view',
  'vehicles_view', 'vehicles_track', 'vehicles_alerts',
  'notifications_view'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- FRANQUEADO: visualização apenas (definido pela franquia)
-- =============================================

INSERT INTO public.role_permissions (admin_role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000008', id
FROM public.permissions
WHERE code IN (
  'dashboard_view',
  'vehicles_view', 'vehicles_track', 'vehicles_alerts',
  'notifications_view'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- Atualizar permissões existentes do Franqueado (role ID 3)
-- para refletir que agora é view-only
-- =============================================

DELETE FROM public.role_permissions
WHERE admin_role_id = '00000000-0000-0000-0000-000000000003'
AND permission_id NOT IN (
  SELECT id FROM public.permissions
  WHERE code IN (
    'dashboard_view',
    'vehicles_view', 'vehicles_track', 'vehicles_alerts',
    'notifications_view'
  )
);

-- Atualizar descrição da role Franqueado existente
UPDATE public.admin_roles
SET description = 'Função padrão para clientes do tipo Franqueado (visualização)'
WHERE id = '00000000-0000-0000-0000-000000000003';
