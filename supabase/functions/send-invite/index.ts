
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    const { email, name, resetLink } = await req.json();

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
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
