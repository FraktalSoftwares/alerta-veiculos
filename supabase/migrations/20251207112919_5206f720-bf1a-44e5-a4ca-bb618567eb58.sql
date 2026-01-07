-- Primeiro, atualizar as role_permissions para apontar para as permissões corretas em português
-- antes de deletar as duplicadas em inglês

-- Mapear clients.view -> clients_view (Clientes)
UPDATE role_permissions 
SET permission_id = '339867ff-9a00-4bcd-9bc7-d7b98d971d94'
WHERE permission_id = 'e7fb2156-993b-4df7-86ac-afbbcdc3e027'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2 
  WHERE rp2.admin_role_id = role_permissions.admin_role_id 
  AND rp2.permission_id = '339867ff-9a00-4bcd-9bc7-d7b98d971d94'
);

-- Mapear clients.create -> clients_create (Clientes)
UPDATE role_permissions 
SET permission_id = 'e58a4526-822b-4829-862c-d25bdb20d43c'
WHERE permission_id = '5d652878-8a15-414c-9e3f-4a59f6db92d9'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2 
  WHERE rp2.admin_role_id = role_permissions.admin_role_id 
  AND rp2.permission_id = 'e58a4526-822b-4829-862c-d25bdb20d43c'
);

-- Mapear clients.edit -> clients_edit (Clientes)
UPDATE role_permissions 
SET permission_id = 'c45075d9-d99b-4c52-b0aa-d73948ca6f8c'
WHERE permission_id = '1c9df560-9b8c-4520-ab98-6c6c477c4444'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2 
  WHERE rp2.admin_role_id = role_permissions.admin_role_id 
  AND rp2.permission_id = 'c45075d9-d99b-4c52-b0aa-d73948ca6f8c'
);

-- Mapear clients.delete -> clients_delete (Clientes)
UPDATE role_permissions 
SET permission_id = 'cf667269-fd53-4e02-9130-107ea04f5cc7'
WHERE permission_id = '07c2b927-0d93-409b-b886-72545c30f62e'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2 
  WHERE rp2.admin_role_id = role_permissions.admin_role_id 
  AND rp2.permission_id = 'cf667269-fd53-4e02-9130-107ea04f5cc7'
);

-- Mapear finance.view -> finance_view (criar se não existir)
UPDATE role_permissions 
SET permission_id = '54389eea-9e15-434e-8a34-b2b607f4a584'
WHERE permission_id = '1f61c0a8-96d3-427b-9011-d902dde83637'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2 
  WHERE rp2.admin_role_id = role_permissions.admin_role_id 
  AND rp2.permission_id = '54389eea-9e15-434e-8a34-b2b607f4a584'
);

-- Mapear finance.create -> finance_create (Financeiro - criar)
UPDATE role_permissions 
SET permission_id = '54389eea-9e15-434e-8a34-b2b607f4a584'
WHERE permission_id = '1179e151-97e2-43ef-bbfc-3426ca1601b2'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2 
  WHERE rp2.admin_role_id = role_permissions.admin_role_id 
  AND rp2.permission_id = '54389eea-9e15-434e-8a34-b2b607f4a584'
);

-- Mapear finance.edit -> finance_edit (Financeiro)
UPDATE role_permissions 
SET permission_id = '493f5925-8b6a-441f-8988-72d69c667b66'
WHERE permission_id = '84552492-eba2-4f22-84c5-ced3c9bfbd7b'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2 
  WHERE rp2.admin_role_id = role_permissions.admin_role_id 
  AND rp2.permission_id = '493f5925-8b6a-441f-8988-72d69c667b66'
);

-- Mapear finance.delete -> finance_delete (Financeiro)
UPDATE role_permissions 
SET permission_id = '45811a85-5a10-4bbe-a5f3-badee52ca18a'
WHERE permission_id = '07cd2b63-0adb-4bc2-9e7d-b1f8de59e906'
AND NOT EXISTS (
  SELECT 1 FROM role_permissions rp2 
  WHERE rp2.admin_role_id = role_permissions.admin_role_id 
  AND rp2.permission_id = '45811a85-5a10-4bbe-a5f3-badee52ca18a'
);

-- Deletar role_permissions órfãs que apontam para permissões em inglês
DELETE FROM role_permissions WHERE permission_id IN (
  'e7fb2156-993b-4df7-86ac-afbbcdc3e027', -- clients.view
  '5d652878-8a15-414c-9e3f-4a59f6db92d9', -- clients.create
  '1c9df560-9b8c-4520-ab98-6c6c477c4444', -- clients.edit
  '07c2b927-0d93-409b-b886-72545c30f62e', -- clients.delete
  '1f61c0a8-96d3-427b-9011-d902dde83637', -- finance.view
  '1179e151-97e2-43ef-bbfc-3426ca1601b2', -- finance.create
  '84552492-eba2-4f22-84c5-ced3c9bfbd7b', -- finance.edit
  '07cd2b63-0adb-4bc2-9e7d-b1f8de59e906'  -- finance.delete
);

-- Agora deletar as permissões duplicadas em inglês
DELETE FROM permissions WHERE module = 'clients';
DELETE FROM permissions WHERE module = 'finance';

-- Adicionar permissão de Criar que faltava no Financeiro
INSERT INTO permissions (code, name, module, description)
VALUES ('finance_create', 'Criar', 'Financeiro', 'Permite criar lançamentos financeiros')
ON CONFLICT (code) DO NOTHING;

-- Adicionar permissão de Visualizar que faltava no Financeiro
INSERT INTO permissions (code, name, module, description)
VALUES ('finance_view', 'Visualizar', 'Financeiro', 'Permite visualizar registros financeiros')
ON CONFLICT (code) DO NOTHING;