import { Tables } from '@/integrations/supabase/types';

export type Subscription = Tables<'subscriptions'>;
export type SubscriptionPayment = Tables<'subscription_payments'>;
export type SubscriptionHistory = Tables<'subscription_history'>;

export interface SubscriptionDisplay extends Subscription {
  clients?: {
    id: string;
    name: string;
  };
  products?: {
    id: string;
    title: string;
  };
}

export interface SubscriptionPaymentDisplay extends SubscriptionPayment {
  subscription?: SubscriptionDisplay;
}

export interface SubscriptionHistoryDisplay extends SubscriptionHistory {
  profiles?: {
    id: string;
    full_name: string;
  };
}

