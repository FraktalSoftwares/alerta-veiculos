import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: callerError } = await supabaseAuth.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_type')
      .eq('id', callerUser.id)
      .single();

    const allowedTypes = ['admin', 'associacao', 'franquia', 'frotista'];
    if (!callerProfile || !allowedTypes.includes(callerProfile.user_type)) {
      return new Response(
        JSON.stringify({ error: 'Você não tem permissão para criar usuários de cliente' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { client_id, email, password, admin_role_id, send_welcome_email = false } = await req.json();

    console.log('Creating user for client:', client_id, 'with email:', email, 'by caller:', callerUser.id);

    if (!client_id || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'client_id, email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, name, client_type, user_id, owner_id')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      console.error('Client not found:', clientError);
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (callerProfile.user_type !== 'admin' && client.owner_id !== callerUser.id) {
      return new Response(
        JSON.stringify({ error: 'Você não tem permissão para criar usuário neste cliente' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if client already has a user
    if (client.user_id) {
      return new Response(
        JSON.stringify({ error: 'Client already has a user account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map client_type to user_type
    const userTypeMap: Record<string, string> = {
      'admin': 'admin',
      'associacao': 'associacao',
      'associado': 'associado',
      'franquia': 'franquia',
      'franqueado': 'franqueado',
      'frotista': 'frotista',
      'motorista': 'motorista',
    };

    // Roles padrão por tipo de cliente (mesmos IDs da migration)
    const defaultRoleByType: Record<string, string> = {
      'associacao': '00000000-0000-0000-0000-000000000002',
      'associado': '00000000-0000-0000-0000-000000000007',
      'franquia': '00000000-0000-0000-0000-000000000006',
      'franqueado': '00000000-0000-0000-0000-000000000008',
      'frotista': '00000000-0000-0000-0000-000000000004',
      'motorista': '00000000-0000-0000-0000-000000000005',
    };

    const userType = userTypeMap[client.client_type] || 'motorista';

    console.log('Creating auth user with type:', userType);

    // Create the user in Supabase Auth
    // When send_welcome_email is true, set email_confirm to false so Supabase sends the "Confirm sign up" email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: !send_welcome_email,
      user_metadata: {
        full_name: client.name,
        user_type: userType,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);

      let errorMessage = authError.message;
      if (authError.message.includes('already been registered') || (authError as any).code === 'email_exists') {
        errorMessage = 'Este e-mail já está cadastrado no sistema';
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth user created:', authData.user?.id);

    // Link the user to the client
    const { error: updateError } = await supabaseAdmin
      .from('clients')
      .update({ user_id: authData.user?.id, email })
      .eq('id', client_id);

    if (updateError) {
      console.error('Error linking user to client:', updateError);
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);
      } catch (rollbackError) {
        console.error('Failed to rollback user creation:', rollbackError);
      }
      return new Response(
        JSON.stringify({ error: 'Failed to link user to client' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User successfully linked to client');

    // Assign admin role (use provided or default based on client_type)
    const effectiveRoleId = admin_role_id || defaultRoleByType[client.client_type];
    if (effectiveRoleId && authData.user?.id) {
      const { error: roleError } = await supabaseAdmin
        .from('user_admin_roles')
        .insert({
          user_id: authData.user.id,
          admin_role_id: effectiveRoleId,
        });

      if (roleError) {
        console.error('Error assigning admin role:', roleError);
      } else {
        console.log('Admin role assigned successfully:', effectiveRoleId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user?.id,
        welcome_email: { sent: send_welcome_email },
        message: 'User created and linked successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
