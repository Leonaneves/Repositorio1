import type { AutoTextEntry, Character } from "../domain/character.js";

/**
 * Texto automático do Pacto da Lâmina para a área de Proficiências/
 * Armas — a arma de pacto ATUAL é texto livre (`subChoice` da
 * invocação "pacto-da-lamina"), nunca uma escolha permanente/validada
 * contra um catálogo (fonte "INTEGRAÇÃO COMPLETA — BRUXO, INVOCAÇÕES
 * MÍSTICAS E SUBCLASSES" §23: "não deve representar uma limitação
 * permanente da invocação"). O detalhe mecânico completo (Atq/dano com
 * CAR, tipo de dano normal/Necrótico/Psíquico/Radiante) já aparece no bloco
 * "#Invocações Místicas" (rules/warlockPrintedFeatures.ts) — aqui só a
 * proficiência/arma atual, igual ao padrão já usado para Maestria em
 * Arma do Bárbaro/Treinamento Marcial do Bardo.
 */
export function getWarlockPactWeaponProficiencyEntries(character: Character): AutoTextEntry[] {
  if (character.classId !== "bruxo") return [];
  const pactBlade = character.chosenInvocations.find((chosen) => chosen.invocationId === "pacto-da-lamina");
  if (!pactBlade) return [];

  const weaponName = pactBlade.subChoice.trim();
  const suffix = weaponName ? ` (${weaponName})` : "";
  return [{ text: `Pacto da Lâmina: proficiência com a arma de pacto atual${suffix}; Atq/dano pode usar CAR`, source: "class" }];
}
