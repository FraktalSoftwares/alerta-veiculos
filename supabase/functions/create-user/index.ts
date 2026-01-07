import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Define hierarchy rules: which user types each type can create
const ALLOWED_CREATIONS: Record<string, string[]> = {
  admin: ['associacao', 'franqueado', 'frotista', 'motorista'],
  associacao: ['franqueado', 'frotista', 'motorista'],
  franqueado: ['frotista', 'motorista'],
  frotista: ['motorista'],
  motorista: ['motorista'],
}

function canCreateUserType(callerType: string, targetType: string): boolean {
  const allowed = ALLOWED_CREATIONS[callerType] || []
  return allowed.includes(targetType)
}

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

    const callerType = callerProfile.user_type

    const { email, password, full_name, user_type, admin_role_id } = await req.json()

    // Validate required fields
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and full_name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const targetUserType = user_type || 'motorista'

    // Validate hierarchy: check if caller can create the target user type
    if (!canCreateUserType(callerType, targetUserType)) {
      console.log(`Hierarchy violation: ${callerType} tried to create ${targetUserType}`)
      return new Response(
        JSON.stringify({ 
          error: `Você não tem permissão para criar usuários do tipo ${targetUserType}` 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`User ${caller.id} (${callerType}) creating user type: ${targetUserType}`)

    // Create the user with Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        user_type: targetUserType,
      },
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assign admin role if provided (only for appropriate user types)
    if (admin_role_id && newUser.user) {
      const { error: roleError } = await supabaseAdmin
        .from('user_admin_roles')
        .insert({
          user_id: newUser.user.id,
          admin_role_id,
        })

      if (roleError) {
        console.error('Error assigning role:', roleError)
      }
    }

    console.log(`Successfully created user ${newUser.user?.id} with type ${targetUserType}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: {
          id: newUser.user?.id,
          email: newUser.user?.email,
          full_name,
        }
      }),
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