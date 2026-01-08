import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Subscription {
  id: string;
  client_id: string;
  owner_id: string;
  product_id?: string;
  asaas_customer_id?: string;
  asaas_subscription_id?: string;
  subscription_type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  amount: number;
  billing_cycle: number;
  billing_day: number;
  status: 'active' | 'paused' | 'cancelled' | 'expired' | 'trial';
  start_date: string;
  end_date?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  auto_renew: boolean;
  payment_method: 'credit_card' | 'debit_card' | 'pix' | 'boleto' | 'bank_slip';
  card_last_four?: string;
  card_brand?: string;
  card_holder_name?: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  clients?: {
    id: string;
    name: string;
  };
  products?: {
    id: string;
    title: string;
  };
}

export interface CreateSubscriptionData {
  clientId: string;
  productId?: string;
  subscriptionType: 'monthly' | 'quarterly' | 'annual';
  amount: number;
  billingDay: number;
  paymentMethod: 'credit_card' | 'pix' | 'boleto';
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  description?: string;
  startDate?: string;
}

export function useSubscriptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: async (): Promise<Subscription[]> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          clients(id, name),
          products(id, title)
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Subscription[];
    },
    enabled: !!user,
  });
}

export function useSubscription(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: ['subscription', subscriptionId],
    queryFn: async (): Promise<Subscription | null> => {
      if (!subscriptionId) return null;

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          clients(id, name, email, phone),
          products(id, title, description)
        `)
        .eq('id', subscriptionId)
        .is('deleted_at', null)
        .single();

      if (error) throw error;
      return data as Subscription;
    },
    enabled: !!subscriptionId,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateSubscriptionData) => {
      const { data: result, error } = await supabase.functions.invoke('create-subscription', {
        body: data,
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({
        title: 'Assinatura criada',
        description: 'A assinatura foi criada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao criar assinatura',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ subscriptionId, reason }: { subscriptionId: string; reason?: string }) => {
      const { data: result, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId, reason },
      });

      if (error) throw error;
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      toast({
        title: 'Assinatura cancelada',
        description: 'A assinatura foi cancelada com sucesso.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao cancelar assinatura',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSubscriptionPayments(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: ['subscription-payments', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return [];

      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .eq('subscription_id', subscriptionId)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!subscriptionId,
  });
}

export function useSubscriptionHistory(subscriptionId: string | undefined) {
  return useQuery({
    queryKey: ['subscription-history', subscriptionId],
    queryFn: async () => {
      if (!subscriptionId) return [];

      const { data, error } = await supabase
        .from('subscription_history')
        .select(`
          *,
          profiles(id, full_name)
        `)
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!subscriptionId,
  });
}

