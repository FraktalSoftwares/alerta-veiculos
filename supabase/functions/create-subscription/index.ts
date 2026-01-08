import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';
import { getAsaasClient } from '../asaas-client/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  clientId: string;
  productId?: string;
  subscriptionType: 'monthly' | 'quarterly' | 'annual';
  amount: number;
  billingDay: number; // 1-31
  paymentMethod: 'credit_card' | 'pix' | 'boleto';
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  description?: string;
  startDate?: string; // YYYY-MM-DD
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body: CreateSubscriptionRequest = await req.json();

    // 1. Buscar cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        *,
        profiles!clients_owner_id_fkey(
          id,
          email,
          full_name
        )
      `)
      .eq('id', body.clientId)
      .single();

    if (clientError || !client) {
      return new Response(
        JSON.stringify({ error: 'Cliente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Buscar configuração do Asaas
    const { data: asaasConfig, error: configError } = await supabase
      .from('asaas_configuration')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (configError || !asaasConfig) {
      return new Response(
        JSON.stringify({ 
          error: 'Configuração do Asaas não encontrada. Configure suas credenciais primeiro.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const asaasClient = getAsaasClient(asaasConfig.api_key, asaasConfig.environment);

    // 3. Criar ou buscar customer no Asaas
    let asaasCustomerId = client.asaas_customer_id;
    
    if (!asaasCustomerId) {
      try {
        const customerData: any = {
          name: client.name,
          email: client.email || (client.profiles as any)?.email || '',
          phone: client.phone || '',
        };

        if (client.document_number) {
          customerData.cpfCnpj = client.document_number.replace(/\D/g, '');
        }

        const asaasCustomer = await asaasClient.createCustomer(customerData);
        asaasCustomerId = asaasCustomer.id;

        // Atualizar cliente com ID do Asaas
        await supabase
          .from('clients')
          .update({ asaas_customer_id: asaasCustomerId })
          .eq('id', client.id);
      } catch (error) {
        console.error('Error creating customer in Asaas:', error);
        return new Response(
          JSON.stringify({ error: `Erro ao criar cliente no Asaas: ${error.message}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 4. Mapear billing cycle
    const cycleMap: Record<string, 'MONTHLY' | 'QUARTERLY' | 'YEARLY'> = {
      monthly: 'MONTHLY',
      quarterly: 'QUARTERLY',
      annual: 'YEARLY',
    };

    const billingTypeMap: Record<string, 'CREDIT_CARD' | 'PIX' | 'BOLETO'> = {
      credit_card: 'CREDIT_CARD',
      pix: 'PIX',
      boleto: 'BOLETO',
    };

    // 5. Calcular próxima data de vencimento
    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const nextDueDate = new Date(startDate);
    nextDueDate.setDate(body.billingDay);

    if (nextDueDate < startDate) {
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
    }

    // 6. Criar assinatura no Asaas
    const subscriptionData: any = {
      customer: asaasCustomerId,
      billingType: billingTypeMap[body.paymentMethod],
      value: body.amount,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      cycle: cycleMap[body.subscriptionType],
      description: body.description || `Assinatura - ${client.name}`,
      externalReference: `sub_${Date.now()}_${user.id}`,
    };

    if (body.paymentMethod === 'credit_card' && body.creditCard) {
      subscriptionData.creditCard = {
        holderName: body.creditCard.holderName,
        number: body.creditCard.number.replace(/\s/g, ''),
        expiryMonth: body.creditCard.expiryMonth,
        expiryYear: body.creditCard.expiryYear,
        ccv: body.creditCard.cvv,
      };

      // Informações do portador do cartão
      subscriptionData.creditCardHolderInfo = {
        name: body.creditCard.holderName,
        email: client.email || (client.profiles as any)?.email || '',
        cpfCnpj: client.document_number?.replace(/\D/g, '') || '',
        postalCode: '00000000', // Pode ser melhorado
        addressNumber: '0',
      };
    }

    let asaasSubscription;
    try {
      asaasSubscription = await asaasClient.createSubscription(subscriptionData);
    } catch (error) {
      console.error('Error creating subscription in Asaas:', error);
      return new Response(
        JSON.stringify({ error: `Erro ao criar assinatura no Asaas: ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Criar assinatura no banco
    const cycleMonths: Record<string, number> = {
      monthly: 1,
      quarterly: 3,
      annual: 12,
    };

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        client_id: body.clientId,
        owner_id: user.id,
        product_id: body.productId || null,
        asaas_customer_id: asaasCustomerId,
        asaas_subscription_id: asaasSubscription.id,
        subscription_type: body.subscriptionType,
        amount: body.amount,
        billing_cycle: cycleMonths[body.subscriptionType],
        billing_day: body.billingDay,
        status: 'active',
        start_date: startDate.toISOString().split('T')[0],
        payment_method: body.paymentMethod,
        card_last_four: body.creditCard?.number.slice(-4) || null,
        card_holder_name: body.creditCard?.holderName || null,
        description: body.description,
        auto_renew: true,
        synced_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (subError) {
      // Rollback: cancelar assinatura no Asaas
      try {
        await asaasClient.cancelSubscription(asaasSubscription.id);
      } catch (rollbackError) {
        console.error('Error rolling back subscription:', rollbackError);
      }
      
      return new Response(
        JSON.stringify({ error: `Erro ao salvar assinatura: ${subError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Criar histórico
    await supabase.from('subscription_history').insert({
      subscription_id: subscription.id,
      event_type: 'created',
      description: 'Assinatura criada',
      new_value: subscription as any,
      user_id: user.id,
    });

    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          id: subscription.id,
          asaas_subscription_id: asaasSubscription.id,
          status: subscription.status,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Create subscription error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao criar assinatura' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

