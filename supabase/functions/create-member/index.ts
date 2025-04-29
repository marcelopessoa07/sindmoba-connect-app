
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { email, full_name, cpf, specialty, registration_number } = await req.json();

    // Validate input
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the service role key (allows bypassing RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Generate a random password (user will reset it via email)
    const tempPassword = Math.random().toString(36).slice(-8);

    // Create the user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
    });

    if (userError) {
      console.error('Error creating user:', userError);
      throw new Error(`Erro ao criar usuário: ${userError.message}`);
    }

    // We need the user ID to update the profile
    const userId = userData.user.id;

    // Ensure the user's profile is updated with the full name and other details
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        cpf,
        specialty,
        registration_number,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      // Continue with the process even if profile update fails, 
      // as the user has been created - we'll return a warning instead
    }

    // Send the user an invite/welcome email with password reset link
    let warning = null;
    try {
      const { error: inviteError } = await supabaseAdmin.functions.invoke('send-invite', {
        body: { 
          email,
          name: full_name || email
        }
      });

      if (inviteError) {
        console.error('Error sending invite:', inviteError);
        warning = 'Usuário criado, mas falha ao enviar email de convite. O usuário precisará usar a opção de recuperação de senha.';
      }
    } catch (inviteErr) {
      console.error('Exception sending invite:', inviteErr);
      warning = 'Usuário criado, mas falha ao enviar email de convite. O usuário precisará usar a opção de recuperação de senha.';
    }

    // Return success with user data (and any warnings)
    return new Response(
      JSON.stringify({ 
        message: 'Usuário criado com sucesso', 
        userId, 
        warning 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-member function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
