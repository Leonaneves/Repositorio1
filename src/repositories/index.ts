import type { CharacterBuildRepository } from "./CharacterBuildRepository.js";
import type { AnalyticsRepository } from "./AnalyticsRepository.js";
import type { TalentChoiceStatsRepository } from "./TalentChoiceStatsRepository.js";
import { InMemoryBuildStore } from "./inMemory/InMemoryBuildStore.js";
import { hasSupabaseConfig } from "./supabase/client.js";
import { SupabaseCharacterBuildRepository } from "./supabase/SupabaseCharacterBuildRepository.js";
import { SupabaseAnalyticsRepository } from "./supabase/SupabaseAnalyticsRepository.js";
import { SupabaseTalentChoiceStatsRepository } from "./supabase/SupabaseTalentChoiceStatsRepository.js";

export type { CharacterBuildRepository } from "./CharacterBuildRepository.js";
export type { AnalyticsRepository, BuildFilter, DistributionRow } from "./AnalyticsRepository.js";
export type { TalentChoiceStatsRepository } from "./TalentChoiceStatsRepository.js";

/**
 * Fábrica única usada pela UI/serviços — nenhum componente React (nem
 * `services/`) importa Supabase diretamente. Escolhe a implementação
 * Supabase quando `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` estão
 * definidas; caso contrário usa a implementação em memória (mesma
 * usada em teste), para que o app funcione sem nenhum backend
 * configurado.
 */

const inMemoryStore = new InMemoryBuildStore();

let characterBuildRepository: CharacterBuildRepository;
let analyticsRepository: AnalyticsRepository;
let talentChoiceStatsRepository: TalentChoiceStatsRepository;

if (hasSupabaseConfig()) {
  characterBuildRepository = new SupabaseCharacterBuildRepository();
  analyticsRepository = new SupabaseAnalyticsRepository();
  talentChoiceStatsRepository = new SupabaseTalentChoiceStatsRepository();
} else {
  characterBuildRepository = inMemoryStore;
  analyticsRepository = inMemoryStore;
  talentChoiceStatsRepository = inMemoryStore;
}

export function getCharacterBuildRepository(): CharacterBuildRepository {
  return characterBuildRepository;
}

export function getAnalyticsRepository(): AnalyticsRepository {
  return analyticsRepository;
}

export function getTalentChoiceStatsRepository(): TalentChoiceStatsRepository {
  return talentChoiceStatsRepository;
}

/** Exposto só para testes/uso local explícito (ex.: popular dados de exemplo em dev). */
export { InMemoryBuildStore };
