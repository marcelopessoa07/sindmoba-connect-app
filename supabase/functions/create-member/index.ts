
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "npm:resend@2.0.0";

// Initialize Supabase client with service role key to access admin features
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

// Initialize Resend for email sending
const resend = new Resend(Deno.env.get("RESEND_API_KEY") || "");

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateMemberRequest {
  email: string;
  full_name: string | null;
  cpf: string | null;
  phone: string | null;
  registration_number: string | null;
  specialty: string | null;
}

// Generate a random password of specified length
function generateRandomPassword(length = 10) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Received request to create a member");
    
    const { email, full_name, cpf, phone, registration_number, specialty } = await req.json() as CreateMemberRequest;
    
    if (!email) {
      throw new Error("Email is required");
    }

    console.log(`Creating member with email: ${email}`);
    
    // Generate a random password for the initial user account
    const generatedPassword = generateRandomPassword();
    
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true, // Skip email confirmation
      user_metadata: {
        full_name,
        cpf,
        phone,
        specialty,
        registration_number,
      }
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      throw new Error(`Failed to create user account: ${authError.message}`);
    }

    console.log("Auth user created successfully:", authData.user.id);
    
    // Update the user profile with additional information
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name,
        cpf,
        phone,
        specialty,
        registration_number,
      })
      .eq('id', authData.user.id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      // Continue despite profile update error
    }

    // Get contact settings for the sender email
    const { data: contactSettings } = await supabaseAdmin
      .from('contact_settings')
      .select('*')
      .limit(1)
      .maybeSingle();
    
    const fromEmail = contactSettings?.contact_email || 'contato@sindmoba.org.br';
    
    // Get a password reset link for the user to set their own password
    const { data: { properties }, error: resetLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (resetLinkError) {
      console.error("Error generating reset link:", resetLinkError);
      throw new Error(`Failed to generate recovery link: ${resetLinkError.message}`);
    }

    const resetLink = properties?.action_link;
    console.log("Reset link generated:", resetLink);

    // Send the welcome email with password reset link
    if (resetLink) {
      try {
        const emailResult = await resend.emails.send({
          from: `SINDMOBA <${fromEmail}>`,
          to: [email],
          subject: 'Bem-vindo ao SINDMOBA - Configure sua senha',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #336699;">Bem-vindo ao SINDMOBA!</h1>
              <p>Olá ${full_name || ''},</p>
              <p>Sua solicitação de filiação ao SINDMOBA foi <strong>aprovada</strong>!</p>
              <p>Para acessar sua conta, por favor defina sua senha clicando no botão abaixo:</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${resetLink}" style="background-color: #336699; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Definir Senha</a>
              </div>
              <p>Este link expira em 24 horas.</p>
              <p>Se você não solicitou esta filiação, por favor ignore este email.</p>
              <p>Atenciosamente,<br>Equipe SINDMOBA</p>
            </div>
          `,
        });
        
        console.log("Welcome email sent:", emailResult);
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        // Still return success even if email fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Member created successfully", 
        userId: authData.user.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error("Error in create-member function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred", 
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
