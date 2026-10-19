import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase, criado só quando as variáveis de ambiente existem.
 *
 * ⚠️ Nenhum projeto Supabase foi provisionado a partir desta sessão —
 * não há credenciais disponíveis aqui para criar um projeto de verdade.
 * Este arquivo fica pronto para funcionar assim que você criar o
 * projeto e definir `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (ex.:
 * num `.env.local`, nunca commitado). Até lá, `hasSupabaseConfig()`
 * retorna `false` e a fábrica de repositórios (`repositories/index.ts`)
 * usa a implementação em memória, então o app funciona normalmente sem
 * nenhum backend configurado.
 */

function readEnv(key: string): string | undefined {
  // import.meta.env é a forma do Vite expor variáveis de ambiente ao navegador.
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  return env?.[key];
}

export function hasSupabaseConfig(): boolean {
  return Boolean(readEnv("VITE_SUPABASE_URL") && readEnv("VITE_SUPABASE_ANON_KEY"));
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const url = readEnv("VITE_SUPABASE_URL");
  const anonKey = readEnv("VITE_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    throw new Error(
      "Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de usar SupabaseCharacterBuildRepository/SupabaseAnalyticsRepository.",
    );
  }

  cachedClient = createClient(url, anonKey);
  return cachedClient;
}

/**
 * Prova de propriedade exigida pela política de RLS de `character_builds`
 * (fonte "IMPLEMENTAR A BASE DE DADOS PARA FUTURAS RECOMENDAÇÕES" §6: "um
 * UUID enviado pelo navegador sozinho não comprova propriedade"). Usa
 * Supabase Anonymous Auth (`signInAnonymously`) — nenhuma tela de
 * cadastro/login, nenhuma chave privilegiada nova (continua só a mesma
 * chave `anon` pública já usada por `getSupabaseClient`); a sessão
 * resultante é real e autenticada (`auth.uid()` verificável pelo banco),
 * só que sem exigir nenhum dado de identidade do jogador.
 *
 * Relê a sessão ATUAL a cada chamada (leitura local, barata) — nunca
 * reaproveita um `uid` antigo, que ficaria errado se o Supabase renovar
 * ou trocar a sessão anônima. Só a criação de sessão em andamento é
 * compartilhada, para que chamadas concorrentes não abram duas sessões.
 *
 * ⚠️ Exige "Enable anonymous sign-ins" ativado em Authentication →
 * Providers no painel do projeto Supabase — configuração externa que
 * este código não pode ativar por si só. Sem isso, a Promise rejeita e
 * quem chamar trata o erro (ver `services/publishConfirmedCharacter.ts`:
 * a confirmação mostra o erro ao jogador e não marca o personagem como
 * confirmado; nunca bloqueia a criação/exportação do personagem).
 */
let pendingAnonymousSignIn: Promise<string> | null = null;

export async function ensureOwnedSession(client: SupabaseClient = getSupabaseClient()): Promise<string> {
  const { data: existing } = await client.auth.getSession();
  if (existing.session?.user.id) {
    return existing.session.user.id;
  }
  if (!pendingAnonymousSignIn) {
    pendingAnonymousSignIn = signInAnonymously(client).finally(() => {
      pendingAnonymousSignIn = null;
    });
  }
  return pendingAnonymousSignIn;
}

async function signInAnonymously(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session) {
    throw new Error(`Falha ao criar sessão anônima (verifique se "Enable anonymous sign-ins" está ativado no projeto Supabase): ${error?.message ?? "sessão ausente"}`);
  }
  return data.session.user.id;
}
