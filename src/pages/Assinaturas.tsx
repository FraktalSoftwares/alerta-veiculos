import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SubscriptionTable } from '@/components/subscriptions/SubscriptionTable';
import { NewSubscriptionModal } from '@/components/subscriptions/NewSubscriptionModal';
import { useSubscriptions, useCancelSubscription, Subscription } from '@/hooks/useSubscriptions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

export default function Assinaturas() {
  const { data: subscriptions = [], isLoading } = useSubscriptions();
  const cancelSubscription = useCancelSubscription();
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancel = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setIsCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedSubscription) return;

    try {
      await cancelSubscription.mutateAsync({
        subscriptionId: selectedSubscription.id,
        reason: cancelReason || undefined,
      });
      setIsCancelDialogOpen(false);
      setSelectedSubscription(null);
      setCancelReason('');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleViewDetails = (subscription: Subscription) => {
    // TODO: Implementar modal de detalhes
    toast({
      title: 'Detalhes da Assinatura',
      description: `Assinatura: ${subscription.id}`,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      
      <main className="px-[50px] py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Assinaturas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as assinaturas dos seus clientes
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Assinatura
          </Button>
        </div>

        <SubscriptionTable
          subscriptions={subscriptions}
          onCancel={handleCancel}
          onViewDetails={handleViewDetails}
          isLoading={isLoading}
        />

        <NewSubscriptionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
        />

        <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja cancelar esta assinatura? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 py-4">
              <label className="text-sm font-medium">Motivo do cancelamento (opcional)</label>
              <Input
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Digite o motivo do cancelamento"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Confirmar Cancelamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

