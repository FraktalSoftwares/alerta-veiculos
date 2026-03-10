import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildResetPasswordHtml(resetLink: string, siteUrl: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redefinir senha - Alerta Rastreamento</title>
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
                          &#128274;
                        </td>
                      </tr>
                    </table>

                    <!-- Heading -->
                    <h1 style="margin: 0 0 12px 0; font-family: 'Source Sans 3', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 22px; font-weight: 700; color: #1F2937; line-height: 1.3;">
                      Redefinir sua senha
                    </h1>

                    <!-- Text -->
                    <p style="margin: 0 0 24px 0; font-size: 15px; color: #6B7280; line-height: 1.6;">
                      Recebemos uma solicitação para redefinir a senha da sua conta no <strong style="color: #1F2937;">Alerta Rastreamento</strong>. Clique no botão abaixo para criar uma nova senha:
                    </p>

                    <!-- Button -->
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                      <tr>
                        <td style="border-radius: 8px; background-color: #FF8C00;">
                          <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none; border-radius: 8px;">
                            Redefinir Senha
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Security note -->
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #9CA3AF; line-height: 1.6;">
                      Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha permanecerá a mesma.
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #9CA3AF; line-height: 1.6;">
                      Este link expira em 24 horas.
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const siteUrl = Deno.env.get('SITE_URL') || 'https://app.alertarastreamento.com.br';
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Alerta Rastreamento <contato@app.alertarastreamento.com.br>';

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, redirectTo } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Generate the reset password link using Supabase Admin API
    const redirect = redirectTo || `${siteUrl}/nova-senha`;

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim(),
      options: {
        redirectTo: redirect,
      },
    });

    if (linkError) {
      console.error('Error generating reset link:', linkError);
      // Don't reveal if user exists or not
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The generated link contains the token - extract and build the proper redirect URL
    // linkData.properties.action_link contains the full confirmation link
    const actionLink = linkData.properties?.action_link;
    if (!actionLink) {
      console.error('No action link generated');
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email via Resend API
    const htmlContent = buildResetPasswordHtml(actionLink, siteUrl);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email.trim()],
        subject: 'Redefinir senha - Alerta Rastreamento',
        html: htmlContent,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('Resend API error:', res.status, errorBody);
      // Still return success to prevent email enumeration
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await res.json();
    console.log('Reset password email sent successfully:', result.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    // Return success to prevent email enumeration
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
