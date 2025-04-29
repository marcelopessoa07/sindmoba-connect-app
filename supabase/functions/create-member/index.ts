
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API SERVICE ROLE KEY - env var exported by default.
      // WARNING: The service key has admin privileges and should only be used in secure server environments!
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    
    // Parse request body
    const requestData = await req.json()
    const {
      email,
      full_name,
      cpf,
      phone,
      specialty,
      registration_number,
      address,
      current_job,
      document_id
    } = requestData
    
    if (!email) {
      return new Response(JSON.stringify({
        error: 'Email is required'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }
    
    // Generate a random password
    const password = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2)
    
    // Create the user in auth
    const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    
    if (authError) {
      return new Response(JSON.stringify({
        error: authError.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      })
    }
    
    const userId = authData.user.id
    
    // Update profile with additional information
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .update({
        full_name,
        cpf,
        phone,
        specialty,
        registration_number,
        address,
        current_job,
        document_id
      })
      .eq('id', userId)
    
    if (profileError) {
      console.error('Error updating profile:', profileError)
      
      // Try to send invitation anyway
      try {
        await sendInviteEmail(supabaseClient, email, full_name || email)
      } catch (emailError) {
        return new Response(JSON.stringify({
          error: 'Profile update failed',
          warning: 'Failed to send welcome email'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500
        })
      }
      
      return new Response(JSON.stringify({
        error: 'User created but profile update failed'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      })
    }
    
    // Send invitation email
    try {
      await sendInviteEmail(supabaseClient, email, full_name || email)
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      return new Response(JSON.stringify({
        id: userId,
        warning: 'User created but invitation email could not be sent'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }
    
    return new Response(JSON.stringify({
      id: userId,
      message: 'Member created and invitation sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(JSON.stringify({
      error: 'Unexpected error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})

async function sendInviteEmail(supabaseClient, email, name) {
  // Generate a password reset link (which works as an invitation)
  const { data, error } = await supabaseClient.auth.admin.generateLink({
    type: 'recovery',
    email
  })
  
  if (error) {
    throw error
  }
  
  const actionLink = data?.properties?.action_link
  if (!actionLink) {
    throw new Error('Failed to generate password reset link')
  }
  
  // Email content
  const emailContent = {
    to: email,
    subject: 'Bem-vindo ao SINDMOBA - Finalize seu cadastro',
    html: `
    <h1>Bem-vindo ao SINDMOBA</h1>
    <p>Olá ${name},</p>
    <p>Sua solicitação de filiação ao sindicato foi aprovada.</p>
    <p>Para finalizar seu cadastro e definir uma senha, clique no link abaixo:</p>
    <p><a href="${actionLink}">Finalizar Cadastro</a></p>
    <p>Este link é válido por 24 horas.</p>
    <p>Atenciosamente,</p>
    <p>Equipe SINDMOBA</p>
    `
  }
  
  // Call a custom EdgeFunction to send email
  try {
    const { error } = await supabaseClient.functions.invoke('send-invite', {
      body: {
        email: email,
        name: name,
        action_link: actionLink
      }
    })
    
    if (error) {
      throw error
    }
  } catch (error) {
    console.error('Email sending failed:', error)
    throw error
  }
}
