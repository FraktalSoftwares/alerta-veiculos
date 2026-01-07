-- Mapear role_permissions das permissões em inglês para as equivalentes em português
-- notifications -> Notificações
UPDATE role_permissions SET permission_id = 'e6f693ad-b4e7-4a41-9edf-a20a56008e9a'
WHERE permission_id = 'ec515039-2c32-4a03-9351-0c8f1f240924'
AND NOT EXISTS (SELECT 1 FROM role_permissions rp2 WHERE rp2.admin_role_id = role_permissions.admin_role_id AND rp2.permission_id = 'e6f693ad-b4e7-4a41-9edf-a20a56008e9a');

UPDATE role_permissions SET permission_id = 'cce319f0-d905-4da9-84bf-77904abace21'
WHERE permission_id = 'fa8aa579-3255-442a-ba55-b1bf77548fea'
AND NOT EXISTS (SELECT 1 FROM role_permissions rp2 WHERE rp2.admin_role_id = role_permissions.admin_role_id AND rp2.permission_id = 'cce319f0-d905-4da9-84bf-77904abace21');

-- settings -> Configurações (já existe em português)
UPDATE role_permissions SET permission_id = '58a745c7-d85d-4339-a503-c6c71c22ca7e'
WHERE permission_id = 'd035a9a0-d749-4c20-b83a-fb28b88ee942'
AND NOT EXISTS (SELECT 1 FROM role_permissions rp2 WHERE rp2.admin_role_id = role_permissions.admin_role_id AND rp2.permission_id = '58a745c7-d85d-4339-a503-c6c71c22ca7e');

UPDATE role_permissions SET permission_id = 'adc4154a-15e4-494c-b28e-7b37519de9b7'
WHERE permission_id = '8fcac43c-11d2-4935-8cf7-a06ef235060b'
AND NOT EXISTS (SELECT 1 FROM role_permissions rp2 WHERE rp2.admin_role_id = role_permissions.admin_role_id AND rp2.permission_id = 'adc4154a-15e4-494c-b28e-7b37519de9b7');

-- stock -> Estoque
UPDATE role_permissions SET permission_id = 'db3d782d-c42c-47b8-9f3c-5d6e8e17ebfe'
WHERE permission_id = 'aea2224f-f1a1-47a2-9e25-072f6dc731ac'
AND NOT EXISTS (SELECT 1 FROM role_permissions rp2 WHERE rp2.admin_role_id = role_permissions.admin_role_id AND rp2.permission_id = 'db3d782d-c42c-47b8-9f3c-5d6e8e17ebfe');

UPDATE role_permissions SET permission_id = '9857ef76-3094-4b2a-a718-71e1e7e3d194'
WHERE permission_id = '0fc643e9-be53-491a-ba55-e1bb85af0c11'
AND NOT EXISTS (SELECT 1 FROM role_permissions rp2 WHERE rp2.admin_role_id = role_permissions.admin_role_id AND rp2.permission_id = '9857ef76-3094-4b2a-a718-71e1e7e3d194');

-- store -> Loja
UPDATE role_permissions SET permission_id = 'e0cebd28-b43a-45ab-8202-32bc12ad64a7'
WHERE permission_id = 'd7f75198-3d01-4a97-9d8d-660f0823b20a'
AND NOT EXISTS (SELECT 1 FROM role_permissions rp2 WHERE rp2.admin_role_id = role_permissions.admin_role_id AND rp2.permission_id = 'e0cebd28-b43a-45ab-8202-32bc12ad64a7');

UPDATE role_permissions SET permission_id = 'fc933520-5d0e-436e-8650-3349f7cc9f12'
WHERE permission_id = 'd1f9c157-a0cd-456d-bfeb-efca189d2484'
AND NOT EXISTS (SELECT 1 FROM role_permissions rp2 WHERE rp2.admin_role_id = role_permissions.admin_role_id AND rp2.permission_id = 'fc933520-5d0e-436e-8650-3349f7cc9f12');

UPDATE role_permissions SET permission_id = 'f88b3db9-b442-4637-931c-aa0d499272c7'
WHERE permission_id = 'ca0f80b9-1dd1-4890-a289-1b37ba88814c'
AND NOT EXISTS (SELECT 1 FROM role_permissions rp2 WHERE rp2.admin_role_id = role_permissions.admin_role_id AND rp2.permission_id = 'f88b3db9-b442-4637-931c-aa0d499272c7');

-- Deletar role_permissions órfãs
DELETE FROM role_permissions WHERE permission_id IN (
  'ec515039-2c32-4a03-9351-0c8f1f240924', 'fa8aa579-3255-442a-ba55-b1bf77548fea',
  'd035a9a0-d749-4c20-b83a-fb28b88ee942', '8fcac43c-11d2-4935-8cf7-a06ef235060b',
  'aea2224f-f1a1-47a2-9e25-072f6dc731ac', '0fc643e9-be53-491a-ba55-e1bb85af0c11',
  'd7f75198-3d01-4a97-9d8d-660f0823b20a', 'd1f9c157-a0cd-456d-bfeb-efca189d2484', 'ca0f80b9-1dd1-4890-a289-1b37ba88814c',
  '53b252bc-6812-4580-8165-16acbae2a3ea', '2bebeef4-332a-4d7c-ad8d-ad036aa5fb53',
  'a45eee1a-14e4-4b15-8e56-68d0231093ab', '8da4b6f1-2190-4f83-9545-99300d162ad7'
);

-- Deletar permissões em inglês
DELETE FROM permissions WHERE module IN ('notifications', 'settings', 'stock', 'store', 'users', 'vehicles');

-- Criar módulo Usuários em português (se não existir)
INSERT INTO permissions (code, name, module, description) VALUES
  ('users_view', 'Visualizar', 'Usuários', 'Permite visualizar lista de usuários'),
  ('users_create', 'Criar', 'Usuários', 'Permite criar novos usuários'),
  ('users_edit', 'Editar', 'Usuários', 'Permite editar usuários'),
  ('users_delete', 'Excluir', 'Usuários', 'Permite excluir usuários')
ON CONFLICT (code) DO NOTHING;

-- Criar módulo Veículos em português (se não existir)
INSERT INTO permissions (code, name, module, description) VALUES
  ('vehicles_view', 'Visualizar', 'Veículos', 'Permite visualizar veículos'),
  ('vehicles_create', 'Criar', 'Veículos', 'Permite criar veículos'),
  ('vehicles_edit', 'Editar', 'Veículos', 'Permite editar veículos'),
  ('vehicles_delete', 'Excluir', 'Veículos', 'Permite excluir veículos'),
  ('vehicles_block', 'Bloquear', 'Veículos', 'Permite bloquear/desbloquear veículos'),
  ('vehicles_track', 'Rastrear', 'Veículos', 'Permite rastrear veículos no mapa'),
  ('vehicles_history', 'Histórico', 'Veículos', 'Permite visualizar histórico de veículos')
ON CONFLICT (code) DO NOTHING;