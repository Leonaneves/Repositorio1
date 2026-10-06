import type { AbilityKey } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { ELVEN_LINEAGES, findSpeciesLineageOption, getSpeciesLineageOptions, hasSpeciesLineage } from "../data/speciesLineages.js";
import { getEffectiveAbilityScore } from "./abilities.js";
import { getSpellcastingAbility } from "./spellcasting.js";

const ELFO_FLORESTA_ID = "elfo-floresta";

/**
 * Se a parte de Linhagem/Ancestralidade da etapa Espécie já está
 * resolvida — usado por `rules/builderProgress.ts` para bloquear o
 * avanço (fonte "IMPLEMENTAR LINHAGENS..." §2: "Exigir a escolha para
 * considerar essa parte concluída"). `true` para espécies sem linhagem
 * (nada a resolver) ou sem espécie escolhida ainda (a etapa Espécie já
 * bloqueia por falta de espécie, via seu próprio motivo — este helper
 * não duplica aquele aviso). O atributo de conjuração do Elfo/Gnomo/
 * Tiefling é sempre resolvido automaticamente (`getSpeciesLineageSpellcastingAbility`),
 * nunca uma escolha manual separada — só a própria linhagem precisa ser escolhida.
 */
export function isSpeciesLineageResolved(character: Character): boolean {
  if (!character.speciesId) return true;
  if (!hasSpeciesLineage(character.speciesId)) return true;

  return findSpeciesLineageOption(character.speciesId, character.speciesLineageId) !== null;
}

/** Tipo de dano da linhagem ATUAL (Draconato/Tiefling) — `null` sem espécie/linhagem com esse campo, ou ainda não escolhida. */
export function getSpeciesLineageDamageType(character: Character): string | null {
  if (!character.speciesId) return null;
  const chosen = findSpeciesLineageOption(character.speciesId, character.speciesLineageId);
  if (!chosen) return null;
  return "damageType" in chosen ? (chosen as { damageType: string }).damageType : null;
}

/**
 * Bônus de deslocamento concedido pela Linhagem Élfica (Elfo da
 * Floresta: +1,5m — fonte "IMPLEMENTAR LINHAGENS..." §5). Lido por
 * `rules/speed.ts#getSpeed` — nunca soma o valor base de novo, só
 * acrescenta a diferença por cima da espécie base (9m + 1,5m = 10,5m),
 * recalculado do zero a cada chamada (nunca um valor persistido).
 */
export function getSpeciesLineageSpeedBonus(character: Character): number {
  if (character.speciesId === "elfo" && character.speciesLineageId === ELFO_FLORESTA_ID) return 1.5;
  return 0;
}

/**
 * Atributo de conjuração das magias de Linhagem Élfica/Gnômica/
 * Infernal (Elfo/Gnomo/Tiefling — mesma regra para as 3 espécies):
 * 1) se a classe (ou o antecedente, via `getSpellcastingAbility` — a
 * mesma função usada em toda a ficha para "o atributo de conjuração
 * do personagem", nunca duplicada aqui) já define um atributo de
 * conjuração, usa esse; 2) senão, o maior valor EFETIVO entre
 * INT/SAB/CAR, com empate decidido por INT > SAB > CAR (nunca escolhe
 * INT automaticamente só por ser o primeiro — só quando os 3 empatam
 * ou INT já é o maior). Sempre automático — nunca uma escolha manual
 * separada do jogador (ajuste pedido depois da entrega original: usar
 * `getSpellcastingAbility` para o Elfo também, em vez do atributo
 * manual que existia antes só para ele).
 */
export function getSpeciesLineageSpellcastingAbility(character: Character): AbilityKey {
  const classAbility = getSpellcastingAbility(character);
  if (classAbility) return classAbility;

  const candidates: AbilityKey[] = ["INT", "SAB", "CAR"];
  let best = candidates[0];
  let bestScore = getEffectiveAbilityScore(character, best);
  for (const ability of candidates.slice(1)) {
    const score = getEffectiveAbilityScore(character, ability);
    if (score > bestScore) {
      best = ability;
      bestScore = score;
    }
  }
  return best;
}

/** Linhagens Élficas, reexportado aqui por conveniência de quem só precisa resolver a lista (ex.: UI/testes). */
export { ELVEN_LINEAGES, getSpeciesLineageOptions };
