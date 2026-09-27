import { computedChoice, type ComputedChoice } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import type { SizeId } from "../domain/ids.js";
import { species } from "../data/species.js";

/**
 * Tamanho = derivado da espécie, mas sempre sobrescrevível pelo
 * jogador. Ao trocar de espécie, `auto` muda; se não houver
 * `manualOverride`, `total` acompanha `auto` automaticamente. Isso é o
 * que a decisão do projeto pediu: "deve sim ser sobrescrito ao trocar
 * de espécie, mas deve sempre ser editável também".
 */
export function getSize(character: Character): ComputedChoice<SizeId | null> {
  const auto = character.speciesId ? species[character.speciesId].size : null;
  return computedChoice(auto, character.size.manualOverride);
}
