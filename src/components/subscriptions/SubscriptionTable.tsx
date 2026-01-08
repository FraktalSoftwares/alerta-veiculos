import { SubscriptionTableHeader } from './SubscriptionTableHeader';
import { SubscriptionTableRow } from './SubscriptionTableRow';
import { Subscription } from '@/hooks/useSubscriptions';
import { Skeleton } from '@/components/ui/skeleton';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onCancel?: (subscription: Subscription) => void;
  onViewDetails?: (subscription: Subscription) => void;
  isLoading?: boolean;
}

export function SubscriptionTable({ 
  subscriptions, 
  onCancel, 
  onViewDetails, 
  isLoading 
}: SubscriptionTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <SubscriptionTableHeader />
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4">
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <SubscriptionTableHeader />
        <div className="px-6 py-12 text-center text-muted-foreground">
          Nenhuma assinatura encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <SubscriptionTableHeader />
      <div className="divide-y divide-border">
        {subscriptions.map((subscription) => (
          <SubscriptionTableRow
            key={subscription.id}
            subscription={subscription}
            onCancel={onCancel}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}

