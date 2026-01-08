import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const event = payload.event; // PAYMENT_CONFIRMED, PAYMENT_RECEIVED, etc
    const payment = payload.payment;
    const subscription = payload.subscription;

    console.log('Asaas webhook received:', event, payment?.id || subscription?.id);

    // 1. Salvar evento
    const { data: webhookEvent, error: webhookError } = await supabase
      .from('asaas_webhook_events')
      .insert({
        event_type: event,
        asaas_event_id: payment?.id || subscription?.id || payload.id || `evt_${Date.now()}`,
        payload: payload,
        processed: false,
      })
      .select()
      .single();

    if (webhookError) {
      console.error('Error saving webhook event:', webhookError);
    }

    // 2. Processar evento
    let processed = false;
    let errorMessage: string | null = null;

    try {
      switch (event) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
          processed = await handlePaymentConfirmed(supabase, payment);
          break;
        
        case 'PAYMENT_OVERDUE':
          processed = await handlePaymentOverdue(supabase, payment);
          break;
        
        case 'PAYMENT_REFUNDED':
          processed = await handlePaymentRefunded(supabase, payment);
          break;
        
        case 'SUBSCRIPTION_CANCELLED':
          processed = await handleSubscriptionCancelled(supabase, subscription);
          break;
        
        case 'SUBSCRIPTION_UPDATED':
          processed = await handleSubscriptionUpdated(supabase, subscription);
          break;
        
        default:
          console.log('Unhandled event type:', event);
          processed = true; // Marcar como processado mesmo sem ação
      }
    } catch (error) {
      errorMessage = error.message;
      console.error('Error processing webhook:', error);
    }

    // 3. Atualizar evento
    if (webhookEvent) {
      await supabase
        .from('asaas_webhook_events')
        .update({
          processed,
          processed_at: processed ? new Date().toISOString() : null,
          error_message: errorMessage,
        })
        .eq('id', webhookEvent.id);
    }

    return new Response(
      JSON.stringify({ success: true, processed }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handlers
async function handlePaymentConfirmed(supabase: any, payment: any) {
  if (!payment || !payment.id) {
    console.error('Payment data missing');
    return false;
  }

  // Buscar pagamento por ID do Asaas
  const { data: subscriptionPayment, error } = await supabase
    .from('subscription_payments')
    .select(`
      *,
      subscriptions!inner(
        id,
        owner_id,
        client_id
      )
    `)
    .eq('asaas_payment_id', payment.id)
    .single();

  if (error || !subscriptionPayment) {
    // Tentar buscar por subscription_id se o pagamento ainda não foi criado
    if (payment.subscription) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('asaas_subscription_id', payment.subscription)
        .single();

      if (sub) {
        // Criar pagamento se não existir
        await supabase.from('subscription_payments').insert({
          subscription_id: sub.id,
          asaas_payment_id: payment.id,
          amount: payment.value,
          due_date: payment.dueDate,
          paid_date: payment.confirmationDate || new Date().toISOString().split('T')[0],
          status: 'paid',
          billing_period_start: payment.dueDate,
          billing_period_end: payment.dueDate,
          invoice_url: payment.invoiceUrl,
          payment_method: mapPaymentMethod(payment.billingType),
        });

        // Criar registro financeiro
        await supabase.from('finance_records').insert({
          owner_id: sub.owner_id,
          client_id: sub.client_id,
          type: 'revenue',
          amount: payment.value,
          description: `Pagamento assinatura - ${payment.description || ''}`,
          payment_date: payment.confirmationDate || new Date().toISOString().split('T')[0],
          status: 'paid',
          payment_method: mapPaymentMethod(payment.billingType),
          reference_month: new Date().toISOString().split('T')[0],
        });

        // Criar histórico
        await supabase.from('subscription_history').insert({
          subscription_id: sub.id,
          event_type: 'payment_succeeded',
          description: `Pagamento confirmado: R$ ${payment.value}`,
          asaas_event_id: payment.id,
        });

        return true;
      }
    }
    
    console.error('Payment not found:', payment.id);
    return false;
  }

  // Atualizar pagamento
  await supabase
    .from('subscription_payments')
    .update({
      status: 'paid',
      paid_date: payment.confirmationDate || new Date().toISOString().split('T')[0],
      invoice_url: payment.invoiceUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionPayment.id);

  // Criar registro financeiro se ainda não existe
  const { data: existingFinance } = await supabase
    .from('finance_records')
    .select('id')
    .eq('description', `Pagamento assinatura - ${payment.description || ''}`)
    .eq('amount', payment.value)
    .limit(1);

  if (!existingFinance || existingFinance.length === 0) {
    await supabase.from('finance_records').insert({
      owner_id: subscriptionPayment.subscriptions.owner_id,
      client_id: subscriptionPayment.subscriptions.client_id,
      type: 'revenue',
      amount: payment.value,
      description: `Pagamento assinatura - ${payment.description || ''}`,
      payment_date: payment.confirmationDate || new Date().toISOString().split('T')[0],
      status: 'paid',
      payment_method: mapPaymentMethod(payment.billingType),
      reference_month: new Date().toISOString().split('T')[0],
    });
  }

  // Criar histórico
  await supabase.from('subscription_history').insert({
    subscription_id: subscriptionPayment.subscription_id,
    event_type: 'payment_succeeded',
    description: `Pagamento confirmado: R$ ${payment.value}`,
    asaas_event_id: payment.id,
  });

  return true;
}

async function handlePaymentOverdue(supabase: any, payment: any) {
  if (!payment || !payment.id) return false;

  const { data: subscriptionPayment } = await supabase
    .from('subscription_payments')
    .select('*, subscriptions!inner(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  if (!subscriptionPayment) return false;

  await supabase
    .from('subscription_payments')
    .update({
      status: 'overdue',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionPayment.id);

  await supabase.from('subscription_history').insert({
    subscription_id: subscriptionPayment.subscription_id,
    event_type: 'payment_overdue',
    description: `Pagamento vencido: R$ ${payment.value}`,
    asaas_event_id: payment.id,
  });

  return true;
}

async function handlePaymentRefunded(supabase: any, payment: any) {
  if (!payment || !payment.id) return false;

  const { data: subscriptionPayment } = await supabase
    .from('subscription_payments')
    .select('*, subscriptions!inner(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  if (!subscriptionPayment) return false;

  await supabase
    .from('subscription_payments')
    .update({
      status: 'refunded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionPayment.id);

  await supabase.from('subscription_history').insert({
    subscription_id: subscriptionPayment.subscription_id,
    event_type: 'payment_refunded',
    description: `Pagamento reembolsado: R$ ${payment.value}`,
    asaas_event_id: payment.id,
  });

  return true;
}

async function handleSubscriptionCancelled(supabase: any, subscription: any) {
  if (!subscription || !subscription.id) return false;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('asaas_subscription_id', subscription.id)
    .single();

  if (!sub) return false;

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id);

  await supabase.from('subscription_history').insert({
    subscription_id: sub.id,
    event_type: 'cancelled',
    description: 'Assinatura cancelada via Asaas',
    asaas_event_id: subscription.id,
  });

  return true;
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  if (!subscription || !subscription.id) return false;

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('asaas_subscription_id', subscription.id)
    .single();

  if (!sub) return false;

  await supabase
    .from('subscriptions')
    .update({
      amount: subscription.value,
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sub.id);

  await supabase.from('subscription_history').insert({
    subscription_id: sub.id,
    event_type: 'plan_changed',
    description: 'Assinatura atualizada no Asaas',
    asaas_event_id: subscription.id,
  });

  return true;
}

function mapPaymentMethod(billingType: string): string {
  const map: Record<string, string> = {
    'CREDIT_CARD': 'credit_card',
    'DEBIT_CARD': 'debit_card',
    'PIX': 'pix',
    'BOLETO': 'boleto',
  };
  return map[billingType] || 'credit_card';
}

