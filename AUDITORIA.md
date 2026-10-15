# Relatório de auditoria – SINDMOBA Connect (código-fonte)

Data: 15/10/2026 · Escopo: repositório `sindmoba-connect-app` (front-end React/Vite + edge functions Supabase).

## 1. Segredos
- Nenhuma senha, token, chave privada, `.env` ou keystore na árvore atual **nem no histórico git** (busca por padrões de chaves e por arquivos `.env/.jks/.pem/.p12`).
- A única credencial no código é a chave **anon** do Supabase (`src/integrations/supabase/client.ts`). Ela é pública por desenho; a segurança depende de RLS.
- `SUPABASE_SERVICE_ROLE_KEY` e `RESEND_API_KEY` são lidos de variáveis de ambiente do Supabase (não estão no código). **Devem ser repassados/rotacionados fora do repositório.**

## 2. Correções aplicadas
| # | Severidade | Problema | Correção |
|---|---|---|---|
| 1 | Crítica | `delete-member`, `create-member`, `create-storage-policies` e `send-invite` aceitavam qualquer JWT (inclusive a chave anon pública): qualquer pessoa podia excluir/criar usuários | Novo `supabase/functions/_shared/auth.ts` (`requireAdmin`): exige usuário logado com `profiles.role = 'admin'`. Chamadas internas com a service role continuam permitidas |
| 2 | Média | `create-member` gerava senha inicial com `Math.random()` | Troca por `crypto.getRandomValues` (24 bytes) |
| 3 | Média | Notícias renderizadas com `dangerouslySetInnerHTML` sem sanitização (XSS) | `DOMPurify.sanitize` em `NewsDetailPage.tsx` |
| 4 | Média/Alta | Dependências vulneráveis | `npm audit fix` aplicado; ver pendências |

Build de produção (`vite build`) passa após as mudanças.

## 3. Pendências / riscos conhecidos
- **As edge functions precisam ser reimplantadas** no Supabase para a correção 1 valer em produção.
- `npm audit --omit=dev` ainda aponta 9 itens (react-router, supabase-js/auth-js e outros) que só se resolvem com atualização de versão maior (`--force`); exigem teste de regressão.
- **RLS não auditado**: o repositório não tem migrations; policies das tabelas e do storage vivem só no banco. Recomenda-se exportar o esquema e revisar.
- Rotas `/admin/*` no front só checam login; a barreira real é RLS + functions (agora com checagem de admin).
- CORS das functions é `*` (aceitável agora que exigem token de admin).
- 81 `console.log`, alguns imprimem perfil/e-mail do usuário; remover antes de produção.
- Este repositório **não contém** chave de assinatura (keystore) nem projeto Android/iOS; é só a aplicação web.
- O código aqui pode divergir do que está em produção (ver carta de entrega).
