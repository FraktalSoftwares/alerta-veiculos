import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.2';

// AsaasClient inline (copiado de asaas-client/index.ts)
class AsaasClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { apiKey: string; environment: 'production' | 'sandbox' }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.environment === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3';
  }

  private async request<T>(method: string, endpoint: string, data?: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'access_token': this.apiKey,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = { method, headers };
    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
      const errorMessage = result.errors?.[0]?.description || 
                          result.message || 
                          `Asaas API error: ${response.status}`;
      throw new Error(errorMessage);
    }

    return result;
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    return this.request('DELETE', `/subscriptions/${subscriptionId}`);
  }
}

function getAsaasClient(apiKey: string, environment: string): AsaasClient {
  return new AsaasClient({
    apiKey,
    environment: environment as 'production' | 'sandbox',
  });
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { data: { user } } = await supabaseUser.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { subscriptionId, reason } = await req.json();

    if (!subscriptionId) {
      return new Response(
        JSON.stringify({ error: 'ID da assinatura é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar assinatura
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .eq('owner_id', user.id)
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Assinatura não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já está cancelada
    if (subscription.status === 'cancelled') {
      return new Response(
        JSON.stringify({ error: 'Assinatura já está cancelada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar configuração do Asaas separadamente
    const { data: asaasConfig, error: configError } = await supabase
      .from('asaas_configuration')
      .select('*')
      .eq('owner_id', subscription.owner_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (configError || !asaasConfig) {
      return new Response(
        JSON.stringify({ error: 'Configuração do Asaas não encontrada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ler API Key dos Secrets do Supabase (NÃO do banco de dados)
    const apiKey = Deno.env.get(asaasConfig.secret_name || 'ASAAS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'ASAAS_API_KEY não configurada nos Secrets do Supabase' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Cancelar no Asaas
    if (subscription.asaas_subscription_id) {
      const asaasClient = getAsaasClient(apiKey, asaasConfig.environment);
      
      try {
        await asaasClient.cancelSubscription(subscription.asaas_subscription_id);
      } catch (error) {
        console.error('Error cancelling in Asaas:', error);
        // Continuar mesmo se falhar no Asaas (pode já estar cancelada)
      }
    }

    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: `Erro ao atualizar assinatura: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar histórico
    await supabase.from('subscription_history').insert({
      subscription_id: subscriptionId,
      event_type: 'cancelled',
      description: reason || 'Assinatura cancelada',
      user_id: user.id,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Assinatura cancelada com sucesso'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Cancel subscription error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro ao cancelar assinatura' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

