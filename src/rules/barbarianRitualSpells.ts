import type { Character, SpellPreparedEntry } from "../domain/character.js";

/**
 * Magias concedidas automaticamente pelo Caminho do Coração Selvagem —
 * "Arauto da Fauna" (nível 3: Falar com Animais, Sentido Feral) e
 * "Arauto da Natureza" (nível 10: Comunhão com a Natureza), todas só
 * como Ritual (nunca consomem espaço de magia), atributo Sabedoria.
 * Vão para a área de Magias do PDF (linhas de `spellsPrepared`), nunca
 * para "Características de Classe" — por isso ficam de fora de
 * `rules/barbarianSubclassPrintedFeatures.ts`.
 *
 * Círculo real de cada magia não foi fornecido pela fonte — não
 * inventado; fica em branco, com a origem/Ritual/atributo registrados
 * em `notes` (os únicos campos pedidos pela fonte).
 */
export function getBarbarianRitualSpells(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "barbaro" || character.subclassId !== "Caminho do Coração Selvagem") return [];

  const entries: SpellPreparedEntry[] = [];
  if (character.level >= 3) {
    entries.push(
      ritualEntry("Falar com Animais"),
      ritualEntry("Sentido Feral"),
    );
  }
  if (character.level >= 10) {
    entries.push(ritualEntry("Comunhão com a Natureza"));
  }
  return entries;
}

function ritualEntry(name: string): SpellPreparedEntry {
  return {
    circle: "",
    name,
    castingTime: "",
    range: "",
    concentration: false,
    ritual: true,
    material: false,
    notes: "Ritual (SAB) — Caminho do Coração Selvagem",
  };
}
