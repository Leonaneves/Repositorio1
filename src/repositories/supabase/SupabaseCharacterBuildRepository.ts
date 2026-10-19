import type { SupabaseClient } from "@supabase/supabase-js";
import type { CharacterBuild, TalentAcquisitionRecord } from "../../domain/characterBuild.js";
import type { CharacterBuildRepository } from "../CharacterBuildRepository.js";
import { ensureOwnedSession, getSupabaseClient } from "./client.js";

interface CharacterBuildRow {
  build_id: string;
  character_id: string;
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
  skill_choices: Record<string, string[]>;
  metamagic_options: string[];
  invocations: string[];
  maneuvers: string[];
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
    character_id: build.characterId,
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
    skill_choices: build.skillChoices,
    metamagic_options: build.metamagicOptions,
    invocations: build.invocationIds,
    maneuvers: build.maneuverIds,
    saving_throw_proficiencies: build.savingThrowProficiencies,
    armor_id: build.armorId,
    shield: build.shield,
    spellcasting_ability: build.spellcastingAbility,
    talent_acquisitions: build.talentAcquisitions,
    updated_at: build.updatedAt,
  };
}

/**
 * Implementação real (Postgres via Supabase). Cada confirmação é um
 * INSERT de um registro novo (`build_id` novo) — nunca atualiza nada
 * já gravado, então um personagem novo (ou uma nova versão do mesmo)
 * nunca altera os anteriores.
 *
 * Só grava colunas estruturadas (ver `toRow`); nenhum campo de texto
 * livre ou pessoal chega perto desta classe — o `CharacterBuild` já
 * chega aqui filtrado por `mapCharacterToBuild`.
 *
 * Antes de gravar, garante uma sessão autenticada (`ensureOwnedSession`)
 * e usa o `uid` dela como `owner_id` — exigido pela política de INSERT
 * (migration 0005). Se a gravação falhar, rejeita: quem chamou
 * (`services/publishConfirmedCharacter.ts`/Revisão) mostra o erro ao
 * jogador e NÃO marca o personagem como confirmado.
 */
export class SupabaseCharacterBuildRepository implements CharacterBuildRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseClient()) {}

  /** INSERT puro (nunca upsert): a política de RLS da migration 0005 só permite inserir versões confirmadas da própria sessão, e não existe mais política de UPDATE/SELECT. */
  async insertConfirmed(build: CharacterBuild): Promise<void> {
    if (build.origin !== "user" || build.status !== "confirmed") throw new Error("Só personagens confirmados são gravados.");
    const ownerId = await ensureOwnedSession(this.client);
    const { error } = await this.client.from("character_builds").insert(toRow(build, ownerId));
    if (error) {
      throw new Error(`Falha ao registrar personagem confirmado: ${error.message}`);
    }
  }
}
