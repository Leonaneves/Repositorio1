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
