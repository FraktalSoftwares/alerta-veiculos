import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { client_id, email, password } = await req.json();

    console.log('Creating user for client:', client_id, 'with email:', email);

    // Validate required fields
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

    // Get client info to determine user_type
    const { data: client, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, name, client_type, user_id')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      console.error('Client not found:', clientError);
      return new Response(
        JSON.stringify({ error: 'Client not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
      'franqueado': 'franqueado',
      'frotista': 'frotista',
      'motorista': 'motorista',
    };

    const userType = userTypeMap[client.client_type] || 'motorista';

    console.log('Creating auth user with type:', userType);

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: client.name,
        user_type: userType,
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      
      // Translate common error messages to Portuguese
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
      // Rollback: delete the created user
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);
      return new Response(
        JSON.stringify({ error: 'Failed to link user to client' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User successfully linked to client');

    return new Response(
      JSON.stringify({ 
        success: true, 
        user_id: authData.user?.id,
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