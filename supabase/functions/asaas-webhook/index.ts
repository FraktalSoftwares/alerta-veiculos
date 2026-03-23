import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Autenticação do webhook
    const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    const receivedToken = req.headers.get('asaas-access-token');

    if (!webhookToken || receivedToken !== webhookToken) {
      console.error('Webhook auth failed - token mismatch');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    const event = payload.event;
    const payment = payload.payment;
    const subscription = payload.subscription;

    // Gerar ID único do evento para idempotência
    const asaasEventId = generateEventId(event, payment, subscription, payload);

    console.log('Asaas webhook received:', event, asaasEventId);

    // 2. Salvar evento com idempotência (upsert com ON CONFLICT)
    const { data: webhookEvent, error: webhookError } = await supabase
      .from('asaas_webhook_events')
      .upsert(
        {
          event_type: event,
          asaas_event_id: asaasEventId,
          payload: payload,
          processed: false,
        },
        { onConflict: 'asaas_event_id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (webhookError) {
      console.error('Error saving webhook event:', webhookError);
    }

    // Se o evento já foi processado, retornar sucesso sem reprocessar
    if (webhookEvent?.processed) {
      console.log('Event already processed, skipping:', asaasEventId);
      return new Response(
        JSON.stringify({ success: true, processed: true, skipped: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Processar evento
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

        case 'PAYMENT_UPDATED':
          processed = await handlePaymentUpdated(supabase, payment);
          break;

        case 'PAYMENT_DELETED':
          processed = await handlePaymentDeleted(supabase, payment);
          break;

        case 'SUBSCRIPTION_CANCELLED':
          processed = await handleSubscriptionCancelled(supabase, subscription);
          break;

        case 'SUBSCRIPTION_UPDATED':
          processed = await handleSubscriptionUpdated(supabase, subscription);
          break;

        default:
          console.log('Unhandled event type:', event);
          processed = true;
      }
    } catch (error) {
      errorMessage = error.message;
      console.error('Error processing webhook:', error);
    }

    // 4. Atualizar evento
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

// =============================================
// Helpers
// =============================================

/** Gera um ID de evento único e determinístico para garantir idempotência */
function generateEventId(event: string, payment: any, subscription: any, payload: any): string {
  // Combinar tipo do evento + ID do recurso para evitar colisão entre eventos diferentes do mesmo pagamento
  const resourceId = payment?.id || subscription?.id || payload.id;
  if (resourceId) {
    return `${event}_${resourceId}`;
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Insere registro no subscription_history apenas se não existir um com mesmo subscription_id + asaas_event_id + event_type */
async function insertHistoryIfNotExists(
  supabase: any,
  subscriptionId: string,
  eventType: string,
  description: string,
  asaasEventId: string
) {
  const { data: existing } = await supabase
    .from('subscription_history')
    .select('id')
    .eq('subscription_id', subscriptionId)
    .eq('event_type', eventType)
    .eq('asaas_event_id', asaasEventId)
    .limit(1);

  if (existing && existing.length > 0) {
    return; // Já existe, não duplicar
  }

  await supabase.from('subscription_history').insert({
    subscription_id: subscriptionId,
    event_type: eventType,
    description,
    asaas_event_id: asaasEventId,
  });
}

/** Insere finance_record apenas se não existir um com mesmo asaas_payment_id no metadata */
async function insertFinanceIfNotExists(
  supabase: any,
  record: {
    owner_id: string;
    client_id: string;
    amount: number;
    description: string;
    payment_date: string;
    payment_method: string;
    asaas_payment_id: string;
    subscription_id: string;
  }
) {
  const { data: existing } = await supabase
    .from('finance_records')
    .select('id')
    .eq('metadata->>asaas_payment_id', record.asaas_payment_id)
    .limit(1);

  if (existing && existing.length > 0) {
    return; // Já existe, não duplicar
  }

  await supabase.from('finance_records').insert({
    owner_id: record.owner_id,
    client_id: record.client_id,
    type: 'revenue',
    amount: record.amount,
    description: record.description,
    payment_date: record.payment_date,
    status: 'paid',
    payment_method: record.payment_method,
    reference_month: record.payment_date,
    metadata: {
      asaas_payment_id: record.asaas_payment_id,
      subscription_id: record.subscription_id,
    },
  });
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

// =============================================
// Handlers
// =============================================

async function handlePaymentConfirmed(supabase: any, payment: any) {
  if (!payment || !payment.id) {
    console.error('Payment data missing');
    return false;
  }

  const paidDate = payment.confirmationDate || new Date().toISOString().split('T')[0];

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
        // Criar pagamento se não existir (upsert por asaas_payment_id)
        await supabase
          .from('subscription_payments')
          .upsert(
            {
              subscription_id: sub.id,
              asaas_payment_id: payment.id,
              amount: payment.value,
              due_date: payment.dueDate,
              paid_date: paidDate,
              status: 'paid',
              billing_period_start: payment.dueDate,
              billing_period_end: payment.dueDate,
              invoice_url: payment.invoiceUrl,
              payment_method: mapPaymentMethod(payment.billingType),
            },
            { onConflict: 'asaas_payment_id' }
          );

        await insertFinanceIfNotExists(supabase, {
          owner_id: sub.owner_id,
          client_id: sub.client_id,
          amount: payment.value,
          description: `Pagamento assinatura - ${payment.description || ''}`,
          payment_date: paidDate,
          payment_method: mapPaymentMethod(payment.billingType),
          asaas_payment_id: payment.id,
          subscription_id: sub.id,
        });

        await insertHistoryIfNotExists(
          supabase,
          sub.id,
          'payment_succeeded',
          `Pagamento confirmado: R$ ${payment.value}`,
          payment.id
        );

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
      paid_date: paidDate,
      invoice_url: payment.invoiceUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionPayment.id);

  await insertFinanceIfNotExists(supabase, {
    owner_id: subscriptionPayment.subscriptions.owner_id,
    client_id: subscriptionPayment.subscriptions.client_id,
    amount: payment.value,
    description: `Pagamento assinatura - ${payment.description || ''}`,
    payment_date: paidDate,
    payment_method: mapPaymentMethod(payment.billingType),
    asaas_payment_id: payment.id,
    subscription_id: subscriptionPayment.subscription_id,
  });

  await insertHistoryIfNotExists(
    supabase,
    subscriptionPayment.subscription_id,
    'payment_succeeded',
    `Pagamento confirmado: R$ ${payment.value}`,
    payment.id
  );

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

  // Incrementar retry_count e calcular próxima tentativa
  const newRetryCount = (subscriptionPayment.retry_count || 0) + 1;
  const maxRetries = subscriptionPayment.max_retries || 3;

  const updateData: Record<string, any> = {
    status: 'overdue',
    retry_count: newRetryCount,
    updated_at: new Date().toISOString(),
  };

  // Se ainda tem retries disponíveis, agendar próxima tentativa (3 dias)
  if (newRetryCount < maxRetries) {
    const nextRetry = new Date();
    nextRetry.setDate(nextRetry.getDate() + 3);
    updateData.next_retry_date = nextRetry.toISOString().split('T')[0];
  } else {
    // Excedeu max retries — marcar como failed e pausar assinatura
    updateData.status = 'failed';
    updateData.next_retry_date = null;
    updateData.failure_reason = 'Número máximo de tentativas excedido';

    await supabase
      .from('subscriptions')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionPayment.subscription_id);

    await insertHistoryIfNotExists(
      supabase,
      subscriptionPayment.subscription_id,
      'paused',
      `Assinatura pausada: pagamento falhou após ${maxRetries} tentativas`,
      payment.id
    );
  }

  await supabase
    .from('subscription_payments')
    .update(updateData)
    .eq('id', subscriptionPayment.id);

  await insertHistoryIfNotExists(
    supabase,
    subscriptionPayment.subscription_id,
    'payment_overdue',
    `Pagamento vencido: R$ ${payment.value} (tentativa ${newRetryCount}/${maxRetries})`,
    payment.id
  );

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

  // Cancelar o finance_record correspondente
  await supabase
    .from('finance_records')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('metadata->>asaas_payment_id', payment.id);

  await insertHistoryIfNotExists(
    supabase,
    subscriptionPayment.subscription_id,
    'payment_refunded',
    `Pagamento reembolsado: R$ ${payment.value}`,
    payment.id
  );

  return true;
}

async function handlePaymentUpdated(supabase: any, payment: any) {
  if (!payment || !payment.id) return false;

  const { data: subscriptionPayment } = await supabase
    .from('subscription_payments')
    .select('*, subscriptions!inner(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  if (!subscriptionPayment) return false;

  // Sincronizar dados do pagamento com o Asaas
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (payment.value !== undefined) updateData.amount = payment.value;
  if (payment.dueDate !== undefined) updateData.due_date = payment.dueDate;
  if (payment.invoiceUrl !== undefined) updateData.invoice_url = payment.invoiceUrl;
  if (payment.billingType !== undefined) updateData.payment_method = mapPaymentMethod(payment.billingType);
  if (payment.status) {
    const statusMap: Record<string, string> = {
      'CONFIRMED': 'paid',
      'RECEIVED': 'paid',
      'PENDING': 'pending',
      'OVERDUE': 'overdue',
      'REFUNDED': 'refunded',
    };
    if (statusMap[payment.status]) {
      updateData.status = statusMap[payment.status];
    }
  }

  await supabase
    .from('subscription_payments')
    .update(updateData)
    .eq('id', subscriptionPayment.id);

  await insertHistoryIfNotExists(
    supabase,
    subscriptionPayment.subscription_id,
    'payment_updated',
    `Pagamento atualizado no Asaas: ${payment.id}`,
    payment.id
  );

  return true;
}

async function handlePaymentDeleted(supabase: any, payment: any) {
  if (!payment || !payment.id) return false;

  const { data: subscriptionPayment } = await supabase
    .from('subscription_payments')
    .select('*, subscriptions!inner(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  if (!subscriptionPayment) return false;

  // Marcar pagamento como cancelado (soft delete)
  await supabase
    .from('subscription_payments')
    .update({
      status: 'failed',
      failure_reason: 'Pagamento removido no Asaas',
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriptionPayment.id);

  // Cancelar finance_record correspondente se existir
  await supabase
    .from('finance_records')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('metadata->>asaas_payment_id', payment.id);

  await insertHistoryIfNotExists(
    supabase,
    subscriptionPayment.subscription_id,
    'payment_deleted',
    `Pagamento removido no Asaas: ${payment.id}`,
    payment.id
  );

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

  // Só atualizar se ainda não estava cancelada (idempotência)
  if (sub.status !== 'cancelled') {
    await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id);
  }

  await insertHistoryIfNotExists(
    supabase,
    sub.id,
    'cancelled',
    'Assinatura cancelada via Asaas',
    subscription.id
  );

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

  await insertHistoryIfNotExists(
    supabase,
    sub.id,
    'plan_changed',
    'Assinatura atualizada no Asaas',
    subscription.id
  );

  return true;
}
