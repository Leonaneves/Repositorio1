import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { species } from "../data/species.js";
import { armors } from "../data/armors.js";
import { getSpeciesLineageSpeedBonus } from "./speciesLineage.js";
import { getFeatSpeedBonus } from "./feats.js";

/**
 * Bônus de deslocamento concedido pela classe.
 *
 * - Monge ("Movimento sem Armadura", PHB 2024): só enquanto ele não
 *   estiver usando armadura nem escudo.
 *   nível 1 → +0m · 2–5 → +3m · 6–9 → +4,5m · 10–13 → +6m · 14–17 → +7,5m · 18–20 → +9m
 * - Bárbaro ("Movimento Rápido"): +3m a partir do nível 5, enquanto
 *   estiver sem armadura. Confirmado por você; a regra não menciona
 *   restrição de escudo, então aqui o bônus vale com ou sem escudo —
 *   sinalize se isso precisar mudar.
 * - Patrulheiro ("Errante", fonte "COMPLETAR A CLASSE PATRULHEIRO NO
 *   BUILDER E NO PDF" §6): +3m a partir do nível 6, enquanto NÃO
 *   estiver usando Armadura PESADA especificamente (ao contrário de
 *   Monge/Bárbaro acima, Armadura Leve/Média e Escudo nunca bloqueiam
 *   este bônus).
 */
export function getClassSpeedBonus(character: Character): number {
  const usingArmor = character.armor.equipped !== "unarmed";

  if (character.classId === "monge") {
    if (usingArmor || character.armor.shield) return 0;

    const level = character.level;
    if (level >= 18) return 9;
    if (level >= 14) return 7.5;
    if (level >= 10) return 6;
    if (level >= 6) return 4.5;
    if (level >= 2) return 3;
    return 0;
  }

  if (character.classId === "barbaro") {
    if (usingArmor) return 0;
    return character.level >= 5 ? 3 : 0;
  }

  if (character.classId === "patrulheiro") {
    if (character.level < 6) return 0;
    const equipped = character.armor.equipped;
    const usingHeavyArmor = equipped !== "unarmed" && armors[equipped].category === "heavy";
    return usingHeavyArmor ? 0 : 3;
  }

  return 0;
}

/**
 * Deslocamento = deslocamento base da espécie + bônus de Linhagem
 * (ex.: Elfo da Floresta, +1,5m — `getSpeciesLineageSpeedBonus`) +
 * bônus de classe/nível (ver `getClassSpeedBonus`) + bônus de Talento
 * (Velocista, +3m fixo, sem condição de armadura — `rules/feats.ts#getFeatSpeedBonus`,
 * fonte "COMPLETAR TALENTOS GERAIS NO BUILDER E NO PDF" §28) + ajuste
 * manual. Decisão do projeto: ao contrário do PDF original (onde era
 * 100% manual), a versão web calcula automaticamente, mas preserva o
 * ajuste manual do jogador.
 */
export function getSpeed(character: Character): ComputedValue {
  const speciesSpeed = character.speciesId ? species[character.speciesId].baseSpeed : 0;
  const lineageBonus = getSpeciesLineageSpeedBonus(character);
  const classBonus = getClassSpeedBonus(character);
  const featBonus = getFeatSpeedBonus(character);
  const auto = speciesSpeed + lineageBonus + classBonus + featBonus;
  return computedValue(auto, character.speed.manualAdjustment);
}

/**
 * Afinidade Aquática (Círculo do Mar, nível 6 — fonte "INTEGRAÇÃO
 * COMPLETA — DRUIDA E SUBCLASSES" §44): Deslocamento de Natação = o
 * Deslocamento normal — PERMANENTE (não depende de Ira do Mar estar
 * ativa, ao contrário do Voo de Filho da Tempestade). `null` para
 * qualquer personagem sem essa característica. Não existe campo
 * dedicado de Natação no PDF-molde atual: esta função fica disponível
 * para a futura Ficha Web e para o motor de regras.
 */
export function getSwimSpeed(character: Character): ComputedValue | null {
  if (character.classId !== "druida" || character.subclassId !== "Círculo do Mar" || character.level < 6) return null;
  return getSpeed(character);
}

/**
 * Errante (Patrulheiro, nível 6+ — fonte "COMPLETAR A CLASSE PATRULHEIRO
 * NO BUILDER E NO PDF" §6): Deslocamento de Escalada = o Deslocamento
 * efetivo, JÁ incluindo o +3m de Errante quando aplicável (mesma ordem
 * de cálculo de `getClassSpeedBonus` — nunca soma o +3m de novo).
 * `null` para qualquer personagem sem essa característica.
 */
export function getRangerClimbSpeed(character: Character): ComputedValue | null {
  if (character.classId !== "patrulheiro" || character.level < 6) return null;
  return getSpeed(character);
}

/** Mesma regra de `getRangerClimbSpeed`, para Deslocamento de Natação. */
export function getRangerSwimSpeed(character: Character): ComputedValue | null {
  if (character.classId !== "patrulheiro" || character.level < 6) return null;
  return getSpeed(character);
}
