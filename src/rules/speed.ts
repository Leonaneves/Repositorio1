import { computedValue, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import type { ClassId } from "../domain/ids.js";
import { species } from "../data/species.js";

/**
 * ⚠️ PENDENTE DE CONFIRMAÇÃO (ver relatório desta etapa): o PDF
 * original NÃO calculava deslocamento por classe (era campo 100%
 * manual). Sei que Monge (Movimento sem Armadura) altera o
 * deslocamento por nível no D&D 2024, mas não tenho a tabela exata
 * (nível inicial e incrementos) confirmada nos materiais fornecidos, e
 * não quero inventar números de regra. Por ora esta função devolve
 * sempre 0 (nenhuma classe altera o deslocamento automático) — assim
 * que os valores forem confirmados, preencher aqui.
 */
export function getClassSpeedBonus(_classId: ClassId | null, _level: number): number {
  return 0;
}

/**
 * Deslocamento = deslocamento base da espécie + bônus de classe/nível
 * (ver `getClassSpeedBonus`) + ajuste manual. Decisão do projeto: ao
 * contrário do PDF original (onde era 100% manual), a versão web
 * calcula automaticamente, mas preserva o ajuste manual do jogador.
 */
export function getSpeed(character: Character): ComputedValue {
  const speciesSpeed = character.speciesId ? species[character.speciesId].baseSpeed : 0;
  const classBonus = getClassSpeedBonus(character.classId, character.level);
  const auto = speciesSpeed + classBonus;
  return computedValue(auto, character.speed.manualAdjustment);
}
