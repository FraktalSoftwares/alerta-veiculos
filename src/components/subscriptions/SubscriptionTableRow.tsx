import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/formatters';
import { Subscription } from '@/hooks/useSubscriptions';

interface SubscriptionTableRowProps {
  subscription: Subscription;
  onCancel?: (subscription: Subscription) => void;
  onViewDetails?: (subscription: Subscription) => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-700 dark:text-green-400',
  paused: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400',
  expired: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
  trial: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
};

const statusLabels: Record<string, string> = {
  active: 'Ativa',
  paused: 'Pausada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
  trial: 'Trial',
};

const periodLabels: Record<string, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  annual: 'Anual',
  custom: 'Personalizado',
};

export function SubscriptionTableRow({ 
  subscription, 
  onCancel, 
  onViewDetails 
}: SubscriptionTableRowProps) {
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCancel?.(subscription);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDetails?.(subscription);
  };

  // Calcular próximo vencimento
  const getNextDueDate = () => {
    if (!subscription.billing_day) return '-';
    
    const today = new Date();
    const nextDue = new Date(today.getFullYear(), today.getMonth(), subscription.billing_day);
    
    if (nextDue < today) {
      nextDue.setMonth(nextDue.getMonth() + 1);
    }
    
    return nextDue.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div
      onClick={handleViewDetails}
      className="grid grid-cols-[200px_1fr_120px_120px_100px_100px_80px] gap-4 px-6 py-4 text-sm border-b border-border hover:bg-table-row-hover cursor-pointer transition-colors items-center"
    >
      <div className="text-foreground font-medium truncate">
        {subscription.clients?.name || '-'}
      </div>
      
      <div className="text-foreground truncate">
        {subscription.description || subscription.products?.title || 'Assinatura'}
      </div>
      
      <div className="text-foreground font-medium">
        {formatCurrency(subscription.amount)}
      </div>
      
      <div className="text-muted-foreground">
        {periodLabels[subscription.subscription_type] || subscription.subscription_type}
      </div>
      
      <div>
        <Badge 
          variant="outline" 
          className={statusColors[subscription.status] || ''}
        >
          {statusLabels[subscription.status] || subscription.status}
        </Badge>
      </div>
      
      <div className="text-muted-foreground">
        {getNextDueDate()}
      </div>
      
      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleViewDetails}>
              Ver detalhes
            </DropdownMenuItem>
            {subscription.status === 'active' && (
              <DropdownMenuItem onClick={handleCancel} className="text-destructive">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

