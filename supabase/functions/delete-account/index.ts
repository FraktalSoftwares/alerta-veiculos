import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Permite que o usuário autenticado exclua a PRÓPRIA conta.
// Espelha a limpeza de dados relacionados da função delete-user.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Identifica o chamador pelo token da requisição.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user_id = caller.id

    // ============================================================
    // Limpeza de dados relacionados (ordem importa por causa das FKs).
    // ============================================================

    // 1. Remove referências de parent_user_id em outros perfis
    await supabaseAdmin
      .from('profiles')
      .update({ parent_user_id: null })
      .eq('parent_user_id', user_id)

    // 2. Clientes do usuário
    const { data: userClients } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('owner_id', user_id)
    const clientIds = (userClients || []).map((c) => c.id)

    // 3. Assinaturas (do usuário ou de seus clientes)
    let subscriptionIds: string[] = []
    if (clientIds.length > 0) {
      const { data: clientSubs } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .in('client_id', clientIds)
      subscriptionIds = (clientSubs || []).map((s) => s.id)
    }
    const { data: ownerSubs } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('owner_id', user_id)
    const allSubIds = [...new Set([...subscriptionIds, ...(ownerSubs || []).map((s) => s.id)])]

    if (allSubIds.length > 0) {
      await supabaseAdmin.from('asaas_webhook_events').delete().in('subscription_id', allSubIds)
    }

    await supabaseAdmin.from('subscriptions').delete().eq('owner_id', user_id)
    await supabaseAdmin.from('subscription_history').delete().eq('user_id', user_id)
    await supabaseAdmin.from('finance_records').delete().eq('owner_id', user_id)
    await supabaseAdmin.from('orders').delete().eq('buyer_id', user_id)
    await supabaseAdmin.from('notifications').delete().eq('sender_id', user_id)
    await supabaseAdmin.from('asaas_configuration').delete().eq('owner_id', user_id)
    await supabaseAdmin.from('equipment').delete().eq('owner_id', user_id)

    if (clientIds.length > 0) {
      await supabaseAdmin.from('clients').delete().in('id', clientIds)
    }

    await supabaseAdmin.from('user_admin_roles').delete().eq('user_id', user_id)

    // Exclui o usuário do auth (cascateia profiles etc.)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)
    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
