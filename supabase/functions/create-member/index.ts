
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the request body
    const { email, full_name, cpf, specialty, registration_number } = await req.json()

    // Validate required fields
    if (!email || !full_name || !specialty) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: email, full name, and specialty are required',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Create a user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name,
        cpf,
        specialty,
        registration_number,
      },
    })

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Error creating user: ${authError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Generate password reset link
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    if (resetError) {
      return new Response(
        JSON.stringify({ error: `Error generating password reset link: ${resetError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Send welcome email with the reset link
    const { error: emailError } = await supabaseAdmin.functions.invoke('send-invite', {
      body: {
        email,
        name: full_name,
        resetLink: resetData.properties.action_link,
      },
    })

    if (emailError) {
      return new Response(
        JSON.stringify({ error: `Error sending welcome email: ${emailError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Return success
    return new Response(
      JSON.stringify({ success: true, message: 'User created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Unexpected error: ${error.message}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
