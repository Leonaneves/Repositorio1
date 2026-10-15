import type { Character, SpellPreparedEntry } from "../domain/character.js";

/**
 * Magias concedidas automaticamente ao Patrulheiro — pelas magias
 * sempre preparadas de Andarilho Feérico e Vigilante das Sombras
 * (fonte "IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF"
 * §2/§5/§6). Vão para a área de Magias do PDF (`spellsPrepared`),
 * nunca para "Características de Classe" — por isso ficam de fora de
 * `rules/rangerSubclassPrintedFeatures.ts`. Senhor das Feras e Caçador
 * não têm magias sempre preparadas nesta fonte.
 */

function autoEntry(name: string, notes: string): SpellPreparedEntry {
  return { circle: "", name, castingTime: "", range: "", concentration: false, ritual: false, material: false, notes };
}

const SUBCLASS_SPELLS_BY_LEVEL: Record<string, { level: number; name: string }[]> = {
  "Andarilho Feérico": [
    { level: 3, name: "Enfeitiçar Pessoa" },
    { level: 5, name: "Passo Nebuloso" },
    { level: 9, name: "Convocar Feérico" },
    { level: 13, name: "Porta Dimensional" },
    { level: 17, name: "Despistar" },
  ],
  "Vigilante das Sombras": [
    { level: 3, name: "Disfarçar-se" },
    { level: 5, name: "Corda Extradimensional" },
    { level: 9, name: "Medo" },
    { level: 13, name: "Invisibilidade Maior" },
    { level: 17, name: "Similaridade" },
  ],
};

export function getRangerAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "patrulheiro" || !character.subclassId) return [];

  const spells = SUBCLASS_SPELLS_BY_LEVEL[character.subclassId];
  if (!spells) return [];

  return spells
    .filter((tier) => character.level >= tier.level)
    .map((tier) => autoEntry(tier.name, `Sempre preparada — ${character.subclassId} (nível ${tier.level})`));
}
