-- Criar função administrativa "Administrador"
INSERT INTO public.admin_roles (id, name, description, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Administrador', 'Função com acesso completo a todas as funcionalidades do sistema', true)
ON CONFLICT DO NOTHING;

-- Atribuir todas as permissões à função Administrador
INSERT INTO public.role_permissions (admin_role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id
FROM public.permissions
ON CONFLICT DO NOTHING;