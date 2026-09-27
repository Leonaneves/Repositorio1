import type { SupabaseClient } from "@supabase/supabase-js";
import type { CharacterBuild } from "../../domain/characterBuild.js";
import type { CharacterBuildRepository } from "../CharacterBuildRepository.js";
import { getSupabaseClient } from "./client.js";

interface CharacterBuildRow {
  build_id: string;
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
  updated_at: string;
}

function toRow(build: CharacterBuild): CharacterBuildRow {
  return {
    build_id: build.buildId,
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
 */
export class SupabaseCharacterBuildRepository implements CharacterBuildRepository {
  constructor(private readonly client: SupabaseClient = getSupabaseClient()) {}

  async upsert(build: CharacterBuild): Promise<void> {
    const { error } = await this.client.from("character_builds").upsert(toRow(build), { onConflict: "build_id" });
    if (error) {
      throw new Error(`Falha ao gravar build anônimo: ${error.message}`);
    }
  }
}
