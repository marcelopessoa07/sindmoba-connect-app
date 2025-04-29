
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const requestData = await req.json();
    const { email } = requestData;
    
    // Create Supabase client with admin rights to generate password reset link
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // Fetch user profile to get their name
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('email', email)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }
    
    const name = profileData?.full_name || 'Associado';
    
    // Generate password reset link that user will use to set their initial password
    const { data: passwordResetData, error: passwordResetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'http://localhost:3000/login'
      }
    });
    
    if (passwordResetError) {
      throw new Error(`Error generating password reset link: ${passwordResetError.message}`);
    }
    
    const resetLink = passwordResetData.properties.action_link;
    
    // Send email with password reset link
    const { data, error } = await resend.emails.send({
      from: 'SINDMOBA <contato@sindmoba.org.br>',
      to: [email],
      subject: 'Bem-vindo ao SINDMOBA - Configure sua senha',
      html: `
        <h1>Bem-vindo ao SINDMOBA, ${name}!</h1>
        <p>Seu cadastro foi realizado com sucesso.</p>
        <p>Para acessar a plataforma, por favor configure sua senha clicando no link abaixo:</p>
        <p><a href="${resetLink}">Clique aqui para configurar sua senha</a></p>
        <p>Este link é válido por 24 horas.</p>
        <p>Atenciosamente,<br>Equipe SINDMOBA</p>
      `,
    });

    if (error) {
      console.error('Resend API error:', error);
      throw error;
    }

    console.log('Email sent successfully to:', email);
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in send-invite function:', error.message);
    return new Response(
      JSON.stringify({ error: error.message || 'Error sending invitation email' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
