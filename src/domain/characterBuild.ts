import type { AbilityKey } from "./common.js";
import type { ArmorId, BackgroundId, ClassId, SkillKey, SpeciesId } from "./ids.js";

/**
 * Representação ANÔNIMA e ESTRUTURADA de um personagem em construção,
 * usada exclusivamente para estatísticas agregadas da comunidade (ver
 * `services/mapCharacterToBuild.ts`, `repositories/CharacterBuildRepository.ts`
 * e `analytics/`).
 *
 * `buildId` não tem qualquer relação com identidade real — é gerado no
 * navegador (mesmo `Character.id`) e reaproveitado enquanto o jogador
 * edita ESTE personagem; trocar de classe/subclasse/espécie etc. várias
 * vezes atualiza o mesmo registro (upsert por `buildId`), em vez de
 * criar um registro novo a cada alteração (ver §6 do pedido do
 * usuário). Um personagem novo (`resetCharacter`) gera um `buildId`
 * novo.
 *
 * Só existem aqui campos ESTRUTURADOS relevantes para analisar
 * escolhas de criação — nunca texto livre nem qualquer coisa que
 * identifique a pessoa (ver a lista negativa explícita em
 * `services/mapCharacterToBuild.ts`).
 */
export interface CharacterBuild {
  buildId: string;

  level: number;
  classId: ClassId | null;
  subclassId: string | null;
  speciesId: SpeciesId | null;
  backgroundId: BackgroundId | null;

  abilityScores: Record<AbilityKey, number>;

  skillProficiencies: SkillKey[];
  skillExpertise: SkillKey[];
  savingThrowProficiencies: AbilityKey[];

  armorId: ArmorId | null; // null = sem armadura
  shield: boolean;

  /** Atributo de conjuração efetivo (derivado pelo motor de regras — inclui o fallback de antecedente). `null` se o personagem não conjura. */
  spellcastingAbility: AbilityKey | null;

  updatedAt: string; // ISO 8601, atribuído pelo repositório no momento do upsert
}
