import type { Character, SpellPreparedEntry } from "../domain/character.js";
import {
  RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID,
  getRangerDruidicWarriorCantripChoiceId,
} from "../data/features/ranger.js";

/**
 * Magias concedidas automaticamente ao Patrulheiro — Marca do Predador
 * (base, Inimigo Favorito nível 1), os 2 truques de Combatente Druídico
 * (base, Estilo de Luta nível 2, escolha manual sem catálogo), e as
 * magias sempre preparadas de Andarilho Feérico e Vigilante das Sombras
 * (fonte "IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF"
 * §2/§5/§6 — fonte "COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF"
 * §3 para as duas primeiras). Vão para a área de Magias do PDF
 * (`spellsPrepared`), nunca para "Características de Classe" — por
 * isso ficam de fora de `rules/rangerClassPrintedFeatures.ts`/
 * `rules/rangerSubclassPrintedFeatures.ts`. Senhor das Feras e Caçador
 * não têm magias sempre preparadas na fonte das 4 subclasses.
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
  if (character.classId !== "patrulheiro") return [];

  const entries: SpellPreparedEntry[] = [autoEntry("Marca do Predador", "Sempre preparada — Inimigo Favorito (nível 1)")];

  if (character.featureChoiceSelections[RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID]?.value === "Combatente Druídico") {
    for (const slot of [1, 2] as const) {
      const cantrip = character.featureChoiceSelections[getRangerDruidicWarriorCantripChoiceId(slot)]?.value;
      if (typeof cantrip === "string" && cantrip.trim().length > 0) {
        entries.push(autoEntry(cantrip.trim(), "Sempre preparado — Combatente Druídico; Truque de Druida"));
      }
    }
  }

  if (character.subclassId) {
    const spells = SUBCLASS_SPELLS_BY_LEVEL[character.subclassId];
    if (spells) {
      entries.push(
        ...spells
          .filter((tier) => character.level >= tier.level)
          .map((tier) => autoEntry(tier.name, `Sempre preparada — ${character.subclassId} (nível ${tier.level})`)),
      );
    }
  }

  return entries;
}
