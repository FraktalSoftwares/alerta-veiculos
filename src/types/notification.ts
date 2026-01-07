import { Database } from '@/integrations/supabase/types';

export type NotificationRow = Database['public']['Tables']['notifications']['Row'];
export type UserType = Database['public']['Enums']['user_type'];

// UI display type
export interface NotificationDisplay {
  id: string;
  title: string;
  message: string;
  date: string;
  createdAt: string;
  target: string;
  targetType: string | null;
  notificationType: string | null;
  senderId: string;
  isRead: boolean;
}

// Extended notification type with relationships
export interface NotificationWithDetails extends NotificationRow {
  profiles?: {
    id: string;
    full_name: string;
  };
}

// Form types
export interface NotificationFormData {
  title: string;
  message: string;
  target_type: 'all' | 'user_type' | 'specific';
  target_user_type?: UserType;
  target_user_ids?: string[];
  notification_type?: string;
}

// Map target type to display label
function getTargetLabel(notification: NotificationWithDetails): string {
  if (notification.target_type === 'all') {
    return 'Todos os usuários';
  }
  if (notification.target_type === 'user_type' && notification.target_user_type) {
    const typeLabels: Record<UserType, string> = {
      'admin': 'Administradores',
      'associacao': 'Associações',
      'franqueado': 'Franqueados',
      'frotista': 'Frotistas',
      'motorista': 'Motoristas',
    };
    return typeLabels[notification.target_user_type] || notification.target_user_type;
  }
  if (notification.target_type === 'specific') {
    const count = notification.target_user_ids?.length || 0;
    return `${count} usuário(s) específico(s)`;
  }
  return 'Todos os usuários';
}

// Utility function
export function mapNotificationToDisplay(notification: NotificationWithDetails, isRead: boolean = false): NotificationDisplay {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    date: notification.created_at 
      ? new Date(notification.created_at).toLocaleDateString('pt-BR')
      : '-',
    createdAt: notification.created_at || '',
    target: getTargetLabel(notification),
    targetType: notification.target_type,
    notificationType: notification.notification_type,
    senderId: notification.sender_id,
    isRead,
  };
}
