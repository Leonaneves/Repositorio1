import type { Character, SpellPreparedEntry } from "../domain/character.js";
import {
  PALADIN_BLESSED_WARRIOR_CANTRIP_1_CHOICE_ID,
  PALADIN_BLESSED_WARRIOR_CANTRIP_2_CHOICE_ID,
  PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID,
} from "../data/features/paladin.js";

/**
 * Magias concedidas automaticamente ao Paladino — Destruição Divina
 * (Destruição do Paladino, nível 2) e Convocar Montaria (Montaria
 * Fiel, nível 5), os 2 truques de Clérigo de Combatente Abençoado
 * (nível 2, só se escolhido em vez de Estilo de Luta), e as magias de
 * Juramento (sempre preparadas por nível, uma vez escolhida a
 * subclasse). Vão para a área de Magias do PDF (`spellsPrepared`),
 * nunca para "Características de Classe" — por isso ficam de fora de
 * `rules/paladinClassPrintedFeatures.ts`/`paladinSubclassPrintedFeatures.ts`
 * (fonte "IMPLEMENTAR PALADINO E SUAS SUBCLASSES NO BUILDER E NO PDF").
 */

function autoEntry(name: string, notes: string): SpellPreparedEntry {
  return { circle: "", name, castingTime: "", range: "", concentration: false, ritual: false, material: false, notes };
}

const OATH_SPELLS_BY_LEVEL: Record<string, { level: number; names: string[] }[]> = {
  "Juramento da Devoção": [
    { level: 3, names: ["Escudo da Fé", "Proteção Contra o Bem e o Mal"] },
    { level: 5, names: ["Auxílio", "Zona da Verdade"] },
    { level: 9, names: ["Dissipar Magia", "Sinal de Esperança"] },
    { level: 13, names: ["Defensor da Fé", "Movimentação Livre"] },
    { level: 17, names: ["Coluna de Chamas", "Comunhão"] },
  ],
  "Juramento da Glória": [
    { level: 3, names: ["Heroísmo", "Raio Guia"] },
    { level: 5, names: ["Aprimorar Atributo", "Arma Mágica"] },
    { level: 9, names: ["Celeridade", "Proteção contra Energia"] },
    { level: 13, names: ["Compulsão", "Movimentação Livre"] },
    { level: 17, names: ["Lendas e Histórias", "Presença Régia de Yolande"] },
  ],
  "Juramento da Vingança": [
    { level: 3, names: ["Marca do Predador", "Perdição"] },
    { level: 5, names: ["Paralisar Pessoa", "Passo Nebuloso"] },
    { level: 9, names: ["Celeridade", "Proteção contra Energia"] },
    { level: 13, names: ["Banimento", "Porta Dimensional"] },
    { level: 17, names: ["Paralisar Monstro", "Vidência"] },
  ],
  "Juramento dos Anciões": [
    { level: 3, names: ["Falar com Animais", "Golpe Constritor"] },
    { level: 5, names: ["Passo Nebuloso", "Raio Lunar"] },
    { level: 9, names: ["Crescimento de Plantas", "Proteção contra Energia"] },
    { level: 13, names: ["Pele-Rocha", "Tempestade Glacial"] },
    { level: 17, names: ["Comunhão com a Natureza", "Passo Arbóreo"] },
  ],
};

export function getPaladinAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "paladino") return [];

  const entries: SpellPreparedEntry[] = [];

  if (character.level >= 2) {
    entries.push(autoEntry("Destruição Divina", "Sempre preparada — Destruição do Paladino; 1x/DL sem espaço"));
  }
  if (character.level >= 5) {
    entries.push(autoEntry("Convocar Montaria", "Sempre preparada — Montaria Fiel; 1x/DL sem espaço"));
  }

  if (character.featureChoiceSelections[PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID]?.value === "Combatente Abençoado") {
    const cantrip1 = character.featureChoiceSelections[PALADIN_BLESSED_WARRIOR_CANTRIP_1_CHOICE_ID]?.value;
    const cantrip2 = character.featureChoiceSelections[PALADIN_BLESSED_WARRIOR_CANTRIP_2_CHOICE_ID]?.value;
    for (const raw of [cantrip1, cantrip2]) {
      if (typeof raw === "string" && raw.trim().length > 0) {
        entries.push(autoEntry(raw.trim(), "Sempre preparado — Combatente Abençoado; truque de Clérigo, usa Carisma"));
      }
    }
  }

  const oathSpells = character.subclassId ? OATH_SPELLS_BY_LEVEL[character.subclassId] : undefined;
  if (oathSpells) {
    for (const tier of oathSpells) {
      if (character.level < tier.level) continue;
      for (const name of tier.names) {
        entries.push(autoEntry(name, `Sempre preparada — ${character.subclassId}`));
      }
    }
  }

  return entries;
}
