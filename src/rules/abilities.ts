import type { Character } from "../domain/character.js";
import type { AbilityKey } from "../domain/common.js";
import { getAsiAbilityBonus } from "./asi.js";
import { getEpicBoonAbilityIncreaseBonus } from "./epicBoons.js";
import { getFeatAbilityIncreaseBonus } from "./feats.js";

/**
 * `= floor((valor - 10) / 2)` — extraído literalmente dos scripts
 * `<ATR>.MOD` do PDF original.
 */
export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Valor final do atributo, somando: pontuação bruta + bônus do
 * Antecedente atual (`backgroundAbilityBonuses`) + bônus de ASI
 * (`asiSelections`, via `rules/asi.ts#getAsiAbilityBonus`) + bônus
 * permanentes de classe que alteram o próprio valor (não um bônus
 * condicional de teste/CA) — por ora só o Bárbaro/Campeão Primitivo
 * (nível 20: FOR+4, CON+4, máximo 25 — fonte "INTEGRAÇÃO COMPLETA —
 * BÁRBARO E SUBCLASSES" §18, aplicado por último, por cima de todo o
 * resto). O valor bruto que o jogador digitou
 * (`character.abilities[ability].score`) nunca é sobrescrito — cada
 * bônus é somado por cima, igual ao padrão auto+manual já usado em
 * PV/CA/Deslocamento (fonte "REORGANIZAÇÃO DO BUILDER" §18/§30: nunca
 * acumula de forma destrutiva, cada origem fica separada e a soma é
 * sempre recalculada). Todo consumidor que precisa do atributo "final"
 * (modificador de ataque/perícia/salvaguarda/CA/PV/CD de magia, e a
 * exibição de revisão/PDF) deve usar esta função em vez de ler
 * `character.abilities[ability].score` direto — só o EDITOR do valor
 * bruto (`Step6Abilities`/`AbilitiesSection`, onde o jogador digita a
 * pontuação-base) continua lendo/escrevendo o valor cru. Corpo e Mente
 * do Monge (nível 20: DEX+4, SAB+4, máximo 25 — fonte "IMPLEMENTAR
 * MONGE E SUAS SUBCLASSES NO BUILDER E NO PDF" §7) segue o MESMO padrão
 * do Campeão Primitivo — aplicado por último, removido automaticamente
 * se o nível cair abaixo de 20 (gate por `character.level`, nunca um
 * estado próprio).
 *
 * O "Aumento de 1" dos Talentos Gerais (fonte "COMPLETAR TALENTOS GERAIS
 * NO BUILDER E NO PDF" §1, `rules/feats.ts#getFeatAbilityIncreaseBonus`)
 * entra ANTES do teto do Bárbaro/Monge nível 20, com teto de 20 aplicado
 * só sobre a PRÓPRIA contribuição — nunca reduz um valor que já esteja
 * acima de 20 por outra fonte, só limita o quanto este talento
 * especificamente soma.
 *
 * O "+1" de uma Dádiva Épica (fonte "IMPLEMENTAR TALENTOS DE DÁDIVA
 * ÉPICA NO BUILDER E NO PDF" §1, `rules/epicBoons.ts#getEpicBoonAbilityIncreaseBonus`)
 * entra DEPOIS do teto 20 dos Talentos Gerais, com teto PRÓPRIO de 30
 * sobre a PRÓPRIA contribuição — nunca o teto 20 (fonte: "Não aplicar o
 * limite 20 dos talentos anteriores"), e nunca reduz um valor já acima
 * de 30 por outra fonte. Ainda entra ANTES do teto do Bárbaro/Monge
 * nível 20, que continua aplicado por cima de tudo, sem mudança.
 */
export function getEffectiveAbilityScore(character: Character, ability: AbilityKey): number {
  const base = character.abilities[ability].score;
  const backgroundBonus = character.backgroundAbilityBonuses[ability] ?? 0;
  const asiBonus = getAsiAbilityBonus(character, ability);
  const preFeatTotal = base + backgroundBonus + asiBonus;
  const featBonus = Math.max(0, Math.min(getFeatAbilityIncreaseBonus(character, ability), 20 - preFeatTotal));
  const preEpicBoonTotal = preFeatTotal + featBonus;
  const epicBoonBonus = Math.max(0, Math.min(getEpicBoonAbilityIncreaseBonus(character, ability), 30 - preEpicBoonTotal));
  const total = preEpicBoonTotal + epicBoonBonus;
  if (character.classId === "barbaro" && character.level >= 20 && (ability === "FOR" || ability === "CON")) {
    return Math.min(25, total + 4);
  }
  if (character.classId === "monge" && character.level >= 20 && (ability === "DEX" || ability === "SAB")) {
    return Math.min(25, total + 4);
  }
  return total;
}

/**
 * Bônus de proficiência por nível (1–20). Extraído literalmente do
 * script `PROFICIENCIA` do PDF original.
 *
 * Por decisão do projeto, este valor NÃO aceita ajuste manual (não há
 * forma de alterá-lo pelas regras do D&D) — por isso retorna `number`
 * puro, e não `ComputedValue` como os demais valores derivados.
 */
export function getProficiencyBonus(level: number): number {
  if (level >= 1 && level <= 4) return 2;
  if (level >= 5 && level <= 8) return 3;
  if (level >= 9 && level <= 12) return 4;
  if (level >= 13 && level <= 16) return 5;
  if (level >= 17 && level <= 20) return 6;
  throw new RangeError(`Nível inválido: ${level}. Esperado um inteiro entre 1 e 20.`);
}
