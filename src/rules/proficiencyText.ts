import type { Character, AutoTextEntry } from "../domain/character.js";
import { classes } from "../data/classes.js";
import { backgrounds } from "../data/backgrounds.js";
import { getSpeciesTraitsPrintedText } from "./speciesLineagePrintedFeatures.js";

/**
 * Estas funções substituem a técnica do PDF original de concatenar
 * texto automático + texto do jogador numa única string e depois tentar
 * separá-los de volta com `indexOf/substring` (campos `AUTO.ARMAS`,
 * `AUTO.FERRAMENTAS`, `AUTO.ESPECIE`, `AUTO.ANTECEDENTE`). Aqui as
 * `entries` são sempre recalculadas do zero a partir da seleção atual
 * de classe/espécie/antecedente — nunca lidas de volta de um texto
 * concatenado — então não há diff nem perda de sincronização possível.
 * `manualNotes` (armazenado em `Character`) é território exclusivo do
 * jogador e nunca é tocado por estas funções.
 */

export function getClassWeaponProficiencyEntries(character: Character): AutoTextEntry[] {
  if (!character.classId) return [];
  return [{ text: classes[character.classId].weaponProficiencyText, source: "class" }];
}

export function getClassToolProficiencyEntries(character: Character): AutoTextEntry[] {
  if (!character.classId) return [];
  const text = classes[character.classId].toolProficiencyText;
  return text ? [{ text, source: "class" }] : [];
}

export function getSpeciesTraitEntries(character: Character): AutoTextEntry[] {
  if (!character.speciesId) return [];
  return [{ text: getSpeciesTraitsPrintedText(character), source: "species" }];
}

export function getBackgroundFeatEntries(character: Character): AutoTextEntry[] {
  if (!character.backgroundId) return [];
  return [{ text: backgrounds[character.backgroundId].originFeat, source: "background" }];
}

/** Junta as entradas automáticas + notas manuais num único texto para exibição (ex.: impressão/exportação). */
export function renderAutoTextBlock(entries: AutoTextEntry[], manualNotes: string): string {
  const autoText = entries.map((entry) => entry.text).join("\n\n");
  if (!manualNotes.trim()) return autoText;
  if (!autoText) return manualNotes;
  return `${autoText}\n\n${manualNotes}`;
}
