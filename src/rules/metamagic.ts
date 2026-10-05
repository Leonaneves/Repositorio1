import type { Character } from "../domain/character.js";
import { metamagicOptions, metamagicOptionsById, type MetamagicOptionDefinition } from "../data/metamagic.js";

/**
 * Quantidade de opções de Metamagia conhecidas por nível (fonte
 * "INTEGRAÇÃO COMPLETA — FEITICEIRO, METAMAGIA E SUBCLASSES" §10):
 * níveis 2-9 -> 2; 10-16 -> 4; 17-20 -> 6. Tabela transcrita
 * literalmente, nunca deduzida.
 */
export function getMetamagicOptionsKnownCount(level: number): number {
  if (level >= 17) return 6;
  if (level >= 10) return 4;
  if (level >= 2) return 2;
  return 0;
}

/** As opções de Metamagia elegíveis para escolha (todo o catálogo — não há pré-requisito cruzado entre opções). */
export function getSelectableMetamagicOptions(): MetamagicOptionDefinition[] {
  return metamagicOptions;
}

/** Definições resolvidas das opções conhecidas pelo personagem, na ordem em que foram escolhidas. */
export function getKnownMetamagicOptions(character: Character): MetamagicOptionDefinition[] {
  return character.knownMetamagicOptions.map((id) => metamagicOptionsById[id]).filter((option): option is MetamagicOptionDefinition => option !== undefined);
}

/**
 * Se a quantidade de Metamagia conhecida corresponde exatamente ao
 * exigido pelo nível atual, sem duplicatas — usado para travar o
 * avanço do Builder na etapa própria (`canAdvance`,
 * `state/builderStore.ts`). Classes diferentes de Feiticeiro, ou
 * Feiticeiro abaixo do nível 2 (Metamagia ainda não concedida), nunca
 * bloqueiam por aqui.
 */
export function isMetamagicSelectionComplete(character: Character): boolean {
  if (character.classId !== "feiticeiro") return true;
  const required = getMetamagicOptionsKnownCount(character.level);
  if (required === 0) return true;
  const unique = new Set(character.knownMetamagicOptions);
  return unique.size === character.knownMetamagicOptions.length && unique.size === required;
}
