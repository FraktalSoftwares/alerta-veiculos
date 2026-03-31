import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Only admin users can delete other users

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verify the caller is authenticated
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

    // Get caller's user type
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_type')
      .eq('id', caller.id)
      .single()

    if (profileError || !callerProfile) {
      console.error('Error fetching caller profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Could not verify user permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent self-deletion
    if (user_id === caller.id) {
      return new Response(
        JSON.stringify({ error: 'Você não pode excluir sua própria conta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get target user's profile to check hierarchy
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('user_type, full_name')
      .eq('id', user_id)
      .single()

    if (targetError || !targetProfile) {
      console.error('Error fetching target profile:', targetError)
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Only admins can delete users
    if (callerProfile.user_type !== 'admin') {
      console.log(`Permission denied: ${callerProfile.user_type} tried to delete user`)
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem excluir usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User ${caller.id} (${callerProfile.user_type}) deleting user ${user_id} (${targetProfile.user_type})`)

    // ============================================================
    // Clean up all related data before deleting auth user.
    // Order matters due to foreign key constraints (NO ACTION).
    // Tables with CASCADE are handled automatically.
    // ============================================================

    // 1. Nullify parent_user_id references on other profiles
    await supabaseAdmin
      .from('profiles')
      .update({ parent_user_id: null })
      .eq('parent_user_id', user_id)

    // 2. Get all client IDs owned by this user (needed for subscription cleanup)
    const { data: userClients } = await supabaseAdmin
      .from('clients')
      .select('id')
      .eq('owner_id', user_id)

    const clientIds = (userClients || []).map((c) => c.id)

    // 3. Get all subscription IDs (owned by user or belonging to user's clients)
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

    const ownerSubIds = (ownerSubs || []).map((s) => s.id)
    const allSubIds = [...new Set([...subscriptionIds, ...ownerSubIds])]

    // 4. Delete asaas_webhook_events referencing those subscriptions (NO ACTION FK)
    if (allSubIds.length > 0) {
      await supabaseAdmin
        .from('asaas_webhook_events')
        .delete()
        .in('subscription_id', allSubIds)
    }

    // 5. Delete subscriptions owned by user (sub-tables cascade)
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('owner_id', user_id)

    // 6. Delete subscription_history for user (NO ACTION FK)
    await supabaseAdmin
      .from('subscription_history')
      .delete()
      .eq('user_id', user_id)

    // 7. Delete finance_records owned by user (NO ACTION FK)
    await supabaseAdmin
      .from('finance_records')
      .delete()
      .eq('owner_id', user_id)

    // 8. Delete orders by user (order_items cascades)
    await supabaseAdmin
      .from('orders')
      .delete()
      .eq('buyer_id', user_id)

    // 9. Delete notifications sent by user (NO ACTION FK)
    await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('sender_id', user_id)

    // 10. Delete asaas_configuration for user (NO ACTION FK)
    await supabaseAdmin
      .from('asaas_configuration')
      .delete()
      .eq('owner_id', user_id)

    // 11. Delete equipment owned by user (virtual_fences cascades)
    await supabaseAdmin
      .from('equipment')
      .delete()
      .eq('owner_id', user_id)

    // 12. Delete clients owned by user (addresses, billing_settings, client_customization,
    //     secondary_contacts, vehicles, subscriptions all cascade)
    if (clientIds.length > 0) {
      await supabaseAdmin
        .from('clients')
        .delete()
        .in('id', clientIds)
    }

    // 13. Remove user admin roles (has CASCADE but doing explicitly for safety)
    await supabaseAdmin
      .from('user_admin_roles')
      .delete()
      .eq('user_id', user_id)

    // 14. Delete user from auth (cascades to profiles, notification_reads, notification_templates)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id)

    if (deleteError) {
      console.error('Error deleting user:', deleteError)
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Successfully deleted user ${user_id} (${targetProfile.full_name})`)

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
