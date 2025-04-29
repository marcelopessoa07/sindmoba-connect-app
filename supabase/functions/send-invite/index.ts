
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
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
    console.log('Received request to send invite email');
    
    // Get request data
    const requestData = await req.json();
    const { email } = requestData;
    
    if (!email) {
      throw new Error('Email is required');
    }
    
    console.log('Processing invite for email:', email);
    
    // Check if RESEND_API_KEY is configured
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Email service configuration is missing. Please configure the RESEND_API_KEY.',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    // Make sure the API key is valid and not empty
    if (resendApiKey.trim() === '') {
      console.error('RESEND_API_KEY is empty');
      return new Response(
        JSON.stringify({ 
          error: 'Email service API key is empty. Please provide a valid RESEND_API_KEY.',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    const resend = new Resend(resendApiKey);
    
    // Create Supabase client with admin rights to generate password reset link
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase environment variables are not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Backend configuration is incomplete. Please check Supabase environment variables.',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
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
    
    console.log('Generating password reset link for user:', name);
    
    // Generate password reset link that user will use to set their initial password
    const { data: passwordResetData, error: passwordResetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'}/login`
      }
    });
    
    if (passwordResetError) {
      console.error('Error generating password reset link:', passwordResetError);
      return new Response(
        JSON.stringify({ 
          error: `Error generating password reset link: ${passwordResetError.message}`,
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    if (!passwordResetData?.properties?.action_link) {
      console.error('No action link generated');
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate password reset link',
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
    
    const resetLink = passwordResetData.properties.action_link;
    console.log('Reset link generated successfully');
    
    try {
      // Send email with password reset link
      console.log('Attempting to send email with Resend API');
      const emailResult = await resend.emails.send({
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

      if (emailResult.error) {
        console.error('Resend API error:', emailResult.error);
        return new Response(
          JSON.stringify({ 
            error: `Erro no serviço de email: ${emailResult.error.message}`,
            success: false 
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }

      console.log('Email sent successfully to:', email);
      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' }), 
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return new Response(
        JSON.stringify({ 
          error: `Erro ao enviar email: ${emailError.message || 'Unknown error'}`,
          success: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error: any) {
    console.error('Error in send-invite function:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error sending invitation email',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
