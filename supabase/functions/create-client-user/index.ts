import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildWelcomeEmailHtml(name: string, email: string, password: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo ao Alerta Rastreamento</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F5F7; font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F4F5F7; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; margin: 0 auto;">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="${siteUrl}/logo_alerta.png" alt="Alerta Rastreamento" height="40" style="display: block; height: 40px; width: auto;">
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color: #FFFFFF; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06); overflow: hidden;">

              <!-- Orange Accent Bar -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height: 4px; background-color: #FF8C00;"></td>
                </tr>
              </table>

              <!-- Content -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 40px 36px;">

                    <!-- Icon -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                      <tr>
                        <td style="width: 48px; height: 48px; background-color: #FFF3E0; border-radius: 12px; text-align: center; line-height: 48px; font-size: 24px;">
                          &#128075;
                        </td>
                      </tr>
                    </table>

                    <!-- Heading -->
                    <h1 style="margin: 0 0 12px 0; font-family: 'Source Sans 3', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: #1F2937; line-height: 1.3;">
                      Bem-vindo(a), ${name}!
                    </h1>

                    <!-- Text -->
                    <p style="margin: 0 0 24px 0; font-size: 15px; color: #6B7280; line-height: 1.6;">
                      Seu cadastro no <strong style="color: #1F2937;">Alerta Rastreamento</strong> foi realizado com sucesso. Abaixo estão suas credenciais de acesso ao sistema:
                    </p>

                    <!-- Credentials Box -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                      <tr>
                        <td style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px 24px;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding-bottom: 12px;">
                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">E-mail</p>
                                <p style="margin: 0; font-size: 15px; color: #1F2937; font-weight: 600;">${email}</p>
                              </td>
                            </tr>
                            <tr>
                              <td style="border-top: 1px solid #E5E7EB; padding-top: 12px;">
                                <p style="margin: 0 0 4px 0; font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Senha</p>
                                <p style="margin: 0; font-size: 15px; color: #1F2937; font-weight: 600; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px;">${password}</p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                      <tr>
                        <td style="border-radius: 8px; background-color: #FF8C00;">
                          <a href="${siteUrl}/login" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 8px;">
                            Acessar o Sistema
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Security note -->
                    <p style="margin: 0; font-size: 13px; color: #9CA3AF; line-height: 1.6;">
                      Recomendamos que altere sua senha após o primeiro acesso para maior segurança.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 28px 16px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #9CA3AF;">
                &copy; ${new Date().getFullYear()} Alerta Rastreamento. Todos os direitos reservados.
              </p>
              <p style="margin: 0; font-size: 12px; color: #9CA3AF;">
                Este e-mail foi enviado automaticamente. N&atilde;o responda a esta mensagem.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendWelcomeEmail(
  email: string,
  name: string,
  password: string,
  siteUrl: string,
): Promise<{ sent: boolean; reason?: string }> {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not set — welcome email will not be sent');
    return { sent: false, reason: 'RESEND_API_KEY not configured. Set the RESEND_API_KEY secret in your Supabase Edge Function settings.' };
  }

  const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Alerta Rastreamento <noreply@resend.dev>';
  const htmlContent = buildWelcomeEmailHtml(name, email, password, siteUrl);

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: 'Bem-vindo ao Alerta Rastreamento - Seus dados de acesso',
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Resend API error:', res.status, errorBody);
      return { sent: false, reason: `Email service returned status ${res.status}` };
    }

    const result = await res.json();
    console.log('Welcome email sent successfully:', result.id);
    return { sent: true };
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return { sent: false, reason: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';

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

    const allowedTypes = ['admin', 'associacao', 'franqueado'];
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
      'franqueado': 'franqueado',
      'frotista': 'frotista',
      'motorista': 'motorista',
    };

    // Roles padrão por tipo de cliente (mesmos IDs da migration)
    const defaultRoleByType: Record<string, string> = {
      'associacao': '00000000-0000-0000-0000-000000000002',
      'franqueado': '00000000-0000-0000-0000-000000000003',
      'frotista': '00000000-0000-0000-0000-000000000004',
      'motorista': '00000000-0000-0000-0000-000000000005',
    };

    const userType = userTypeMap[client.client_type] || 'motorista';

    console.log('Creating auth user with type:', userType);

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
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

    // Send welcome email if requested
    let welcomeEmail = { sent: false, reason: 'Not requested' };
    if (send_welcome_email) {
      welcomeEmail = await sendWelcomeEmail(email, client.name, password, siteUrl);
      console.log('Welcome email result:', welcomeEmail);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user?.id,
        welcome_email: welcomeEmail,
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
