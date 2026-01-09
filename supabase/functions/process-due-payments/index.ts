import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar pagamentos vencidos e não pagos
    const today = new Date().toISOString().split('T')[0];
    
    const { data: overduePayments, error } = await supabase
      .from('subscription_payments')
      .select(`
        *,
        subscriptions!inner(
          id,
          owner_id
        )
      `)
      .eq('status', 'pending')
      .lte('due_date', today)
      .limit(100);

    if (error) {
      throw error;
    }

    let processed = 0;
    let failed = 0;
    let paused = 0;

    for (const payment of overduePayments || []) {
      try {
        const subscription = payment.subscriptions;
        
        // Buscar configuração do Asaas separadamente
        const { data: config } = await supabase
          .from('asaas_configuration')
          .select('*')
          .eq('owner_id', subscription.owner_id)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        // Usar valores padrão se não houver configuração
        const maxRetries = config?.max_retry_attempts || 3;
        const retryInterval = config?.retry_interval_days || 3;
        const autoRetry = config?.auto_retry_failed_payments ?? true;

        // Marcar como vencido
        await supabase
          .from('subscription_payments')
          .update({
            status: 'overdue',
            updated_at: new Date().toISOString(),
          })
          .eq('id', payment.id);

        // Criar histórico
        await supabase.from('subscription_history').insert({
          subscription_id: payment.subscription_id,
          event_type: 'payment_overdue',
          description: `Pagamento vencido: R$ ${payment.amount}`,
        });

        // Se auto_retry está ativo e ainda há tentativas
        if (
          autoRetry &&
          payment.retry_count < maxRetries
        ) {
          // Incrementar retry
          const nextRetry = new Date();
          nextRetry.setDate(nextRetry.getDate() + retryInterval);

          await supabase
            .from('subscription_payments')
            .update({
              retry_count: payment.retry_count + 1,
              next_retry_date: nextRetry.toISOString().split('T')[0],
              status: 'pending', // Voltar para pending para nova tentativa
            })
            .eq('id', payment.id);

          console.log(`Payment ${payment.id} scheduled for retry on ${nextRetry.toISOString().split('T')[0]}`);
        } else {
          // Pausar assinatura se excedeu tentativas
          if (payment.retry_count >= maxRetries) {
            const { error: pauseError } = await supabase
              .from('subscriptions')
              .update({
                status: 'paused',
                updated_at: new Date().toISOString(),
              })
              .eq('id', payment.subscription_id);

            if (!pauseError) {
              await supabase.from('subscription_history').insert({
                subscription_id: payment.subscription_id,
                event_type: 'paused',
                description: 'Assinatura pausada devido a falhas de pagamento',
              });
              paused++;
            }
          }
        }

        processed++;
      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        failed,
        paused,
        total: overduePayments?.length || 0,
        date: today,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process due payments error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

