import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const json = (body: unknown, status: number, corsHeaders: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// Exige que o chamador seja um usuário com role 'admin' (ou a própria service role,
// usada em chamadas internas entre functions). Retorna uma Response de erro, ou null se autorizado.
export async function requireAdmin(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Não autorizado' }, 401, corsHeaders)

  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (serviceKey && token === serviceKey) return null

  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey, {
    auth: { persistSession: false },
  })

  // A chave anon também é um JWT válido; getUser só aceita token de usuário logado.
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return json({ error: 'Não autorizado' }, 401, corsHeaders)

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') return json({ error: 'Acesso restrito a administradores' }, 403, corsHeaders)
  return null
}
