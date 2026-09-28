import type { Character } from "../domain/character.js";
import { classes, type StartingEquipmentOption } from "../data/classes.js";

/** Opções de equipamento inicial da classe atual — vazio sem classe, ou se a classe ainda não tem dados confirmados (ex.: Artífice). */
export function getStartingEquipmentOptions(character: Character): StartingEquipmentOption[] {
  if (!character.classId) return [];
  return classes[character.classId].startingEquipment ?? [];
}

/**
 * Se o equipamento inicial já foi resolvido: `true` quando a classe
 * não tem opções confirmadas (nada a decidir — nunca trava o Builder
 * por uma classe sem dados, ex.: Artífice) OU quando o jogador já
 * escolheu uma das opções da classe atual.
 */
export function isStartingEquipmentResolved(character: Character): boolean {
  const options = getStartingEquipmentOptions(character);
  if (options.length === 0) return true;
  return options.some((option) => option.id === character.startingEquipmentOptionId);
}

/** Texto pronto para `inventory.equipment` a partir de uma opção (itens em linhas; opção só-ouro vira texto vazio). */
export function formatStartingEquipmentItems(option: StartingEquipmentOption): string {
  return option.items.join("\n");
}
