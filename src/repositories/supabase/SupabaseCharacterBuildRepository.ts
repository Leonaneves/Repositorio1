import type { SupabaseClient } from "@supabase/supabase-js";
import type { CharacterBuild, TalentAcquisitionRecord } from "../../domain/characterBuild.js";
import type { CharacterBuildRepository } from "../CharacterBuildRepository.js";
import { ensureOwnedSession, getSupabaseClient } from "./client.js";

interface CharacterBuildRow {
  build_id: string;
  origin: "user" | "reference";
  status: "draft" | "confirmed";
  /** `auth.uid()` da sessão (Supabase Anonymous Auth) que gravou o registro — exigido pela política de RLS de `0002_build_ownership_and_talents.sql`. */
  owner_id: string;
  reference_source_id: string | null;
  reference_content_type: "extracted" | "synthetic" | null;
  level: number;
  class_id: string | null;
  subclass_id: string | null;
  species_id: string | null;
  background_id: string | null;
  for_score: number;
  dex_score: number;
  con_score: number;
  int_score: number;
  sab_score: number;
  car_score: number;
  skill_proficiencies: string[];
  skill_expertise: string[];
  saving_throw_proficiencies: string[];
  armor_id: string | null;
  shield: boolean;
  spellcasting_ability: string | null;
  talent_acquisitions: TalentAcquisitionRecord[];
  updated_at: string;
}

/**
 * `ownerId`: sempre a sessão anônima ATUAL (ver `ensureOwnedSession`) —
 * nunca reaproveita um `owner_id` vindo do próprio `build` (que não tem
 * esse campo; `CharacterBuild` nunca carrega identidade). Só esta classe
 * grava para `character_builds`, e só grava builds com `origin ===
 * "user"` (o único valor que `mapCharacterToBuild` produz) — a
 * importação de registros de referência (`origin === "reference"`) é de
 * uma etapa futura e passa por um caminho administrativo totalmente
 * diferente (service role key, server-side, nunca por este repositório
 * nem por `VITE_*`), que a política de RLS já bloqueia para esta classe
 * de qualquer forma.
 */
function toRow(build: CharacterBuild, ownerId: string): CharacterBuildRow {
  return {
    build_id: build.buildId,
    origin: build.origin,
    status: build.status,
    owner_id: ownerId,
    reference_source_id: build.referenceSource?.sourceId ?? null,
    reference_content_type: build.referenceSource?.contentType ?? null,
    level: build.level,
    class_id: build.classId,
    subclass_id: build.subclassId,
    species_id: build.speciesId,
    background_id: build.backgroundId,
    for_score: build.abilityScores.FOR,
    dex_score: build.abilityScores.DEX,
    con_score: build.abilityScores.CON,
    int_score: build.abilityScores.INT,
    sab_score: build.abilityScores.SAB,
    car_score: build.abilityScores.CAR,
    skill_proficiencies: build.skillProficiencies,
    skill_expertise: build.skillExpertise,
    saving_throw_proficiencies: build.savingThrowProficiencies,
    armor_id: build.armorId,
    shield: build.shield,
    spellcasting_ability: build.spellcastingAbility,
    talent_acquisitions: build.talentAcquisitions,
    updated_at: build.updatedAt,
  };
}

/**
 * Implementação real (Postgres via Supabase). `upsert` grava por
 * `build_id` (chave primária/`onConflict`), então reenviar o mesmo
 * personagem em construção várias vezes atualiza a mesma linha — nunca
 * duplica.
 *
 * Só grava colunas estruturadas (ver `toRow`); nenhum campo de texto
 * livre ou pessoal chega perto desta classe — o `CharacterBuild` já
 * chega aqui filtrado por `mapCharacterToBuild`.
 *
 * Antes de gravar, garante uma sessão autenticada (`ensureOwnedSession`)
 * e usa o `uid` dela como `owner_id` — é essa sessão, e não qualquer
 * valor vindo do `build`, que a política de RLS (ver migration 0002)
 * exige bater com `auth.uid()` tanto para inserir quanto para atualizar.
 * Se a sessão anônima não puder ser criada (ex.: "Enable anonymous
 * sign-ins" desativado no projeto Supabase), `upsert` rejeita e quem
 * chamou decide o que fazer — `services/buildSync.ts` só registra o erro
 * e nunca deixa isso bloquear a criação/exportação do personagem.
 */
export class SupabaseCharacterBuildRepository implements CharacterBuildRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseClient()) {}

  async upsert(build: CharacterBuild): Promise<void> {
    const ownerId = await ensureOwnedSession(this.client);
    const { error } = await this.client.from("character_builds").upsert(toRow(build, ownerId), { onConflict: "build_id" });
    if (error) {
      throw new Error(`Falha ao gravar build anônimo: ${error.message}`);
    }
  }
}
