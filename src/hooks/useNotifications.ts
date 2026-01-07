import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationWithDetails, NotificationFormData, mapNotificationToDisplay, NotificationDisplay } from '@/types/notification';
import { toast } from 'sonner';

interface UseNotificationsOptions {
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { user } = useAuth();
  const { search = '', page = 1, pageSize = 50 } = options;

  return useQuery({
    queryKey: ['notifications', { search, page, pageSize, userId: user?.id }],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      let query = supabase
        .from('notifications')
        .select(`*`, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,message.ilike.%${search}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Get read status for all notifications
      const notificationIds = (data || []).map(n => n.id);
      let readIds = new Set<string>();
      
      if (notificationIds.length > 0) {
        const { data: reads } = await supabase
          .from('notification_reads')
          .select('notification_id')
          .eq('user_id', user.id)
          .in('notification_id', notificationIds);
        
        readIds = new Set((reads || []).map(r => r.notification_id));
      }

      const notifications: NotificationDisplay[] = (data || []).map((notification) =>
        mapNotificationToDisplay(notification as NotificationWithDetails, readIds.has(notification.id))
      );

      return {
        notifications,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!user,
  });
}

export function useSentNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['sent-notifications', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select(`*`)
        .eq('sender_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((notification) =>
        mapNotificationToDisplay(notification as NotificationWithDetails, true)
      );
    },
    enabled: !!user,
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (formData: NotificationFormData) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          sender_id: user.id,
          title: formData.title,
          message: formData.message,
          target_type: formData.target_type,
          target_user_type: formData.target_user_type || null,
          target_user_ids: formData.target_user_ids || null,
          notification_type: formData.notification_type || 'general',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['sent-notifications'] });
      toast.success('Notificação enviada com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar notificação: ${error.message}`);
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['sent-notifications'] });
      toast.success('Notificação excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao excluir notificação: ${error.message}`);
    },
  });
}

// Hook for unread notifications count (for header badge)
export function useUnreadNotificationsCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['unread-notifications-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      // Get notifications that the user can see
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id');

      if (notifError) throw notifError;

      if (!notifications || notifications.length === 0) return 0;

      // Get which ones are read
      const { data: reads, error: readsError } = await supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', user.id);

      if (readsError) throw readsError;

      const readIds = new Set((reads || []).map(r => r.notification_id));
      const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

      return unreadCount;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('notification_reads')
        .upsert({
          user_id: user.id,
          notification_id: notificationId,
        }, {
          onConflict: 'user_id,notification_id',
          ignoreDuplicates: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
    },
  });
}
