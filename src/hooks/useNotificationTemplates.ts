import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationTemplateDisplay, NotificationTemplateFormData } from '@/types/notification';
import { toast } from 'sonner';

function getTargetLabel(targetType: string | null, targetUserType: string | null): string {
  if (!targetType || targetType === 'all') return 'Todos os usuários';

  if (targetType === 'user_type' && targetUserType) {
    const labels: Record<string, string> = {
      admin: 'Administradores',
      associacao: 'Associações',
      franqueado: 'Franqueados',
      frotista: 'Frotistas',
      motorista: 'Motoristas',
    };
    return labels[targetUserType] || targetUserType;
  }

  return 'Todos os usuários';
}

export function useNotificationTemplates(search: string = '') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-templates', user?.id, search],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((t): NotificationTemplateDisplay => ({
        id: t.id,
        title: t.title,
        message: t.message,
        date: t.created_at
          ? new Date(t.created_at).toLocaleDateString('pt-BR')
          : '-',
        createdAt: t.created_at || '',
        targetType: t.target_type,
        targetUserType: t.target_user_type,
        notificationType: t.notification_type,
      }));
    },
    enabled: !!user,
  });
}

export function useCreateNotificationTemplate() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: NotificationTemplateFormData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notification_templates')
        .insert({
          user_id: user.id,
          title: formData.title,
          message: formData.message,
          target_type: formData.target_type || 'all',
          target_user_type: formData.target_user_type || null,
          notification_type: formData.notification_type || 'general',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Modelo salvo com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar modelo: ${error.message}`);
    },
  });
}

export function useDeleteNotificationTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Modelo excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir modelo: ${error.message}`);
    },
  });
}

export { getTargetLabel };
