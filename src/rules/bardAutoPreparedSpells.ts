import type { Character, SpellPreparedEntry } from "../domain/character.js";

/**
 * Magias concedidas automaticamente pelo Bardo — "Magia Fascinante"
 * (Colégio do Glamour, nível 3: Enfeitiçar Pessoa, Reflexos), "Manto de
 * Majestade" (Glamour, nível 6: Comando) e "Palavras de Criação" (base
 * da classe, nível 20: Palavra de Poder: Matar, Palavra de Poder:
 * Salvar) — todas sempre preparadas. Vão para a área de Magias do PDF
 * (`spellsPrepared`), nunca para "Características de Classe" — por
 * isso ficam de fora de `rules/bardPrintedFeatures.ts`/
 * `bardSubclassPrintedFeatures.ts`.
 *
 * Círculo real de cada magia não foi fornecido pela fonte — não
 * inventado; fica em branco, com a origem registrada em `notes` (o
 * único campo pedido pela fonte). Diferente dos rituais do Bárbaro,
 * estas NÃO são Rituais nem usam um atributo alternativo — contam
 * normalmente como magias de Bardo (CAR).
 */
export function getBardAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "bardo") return [];

  const entries: SpellPreparedEntry[] = [];
  if (character.subclassId === "Colégio do Glamour" && character.level >= 3) {
    entries.push(autoEntry("Enfeitiçar Pessoa", "Magia Fascinante — Colégio do Glamour"), autoEntry("Reflexos", "Magia Fascinante — Colégio do Glamour"));
  }
  if (character.subclassId === "Colégio do Glamour" && character.level >= 6) {
    entries.push(autoEntry("Comando", "Manto de Majestade — Colégio do Glamour"));
  }
  if (character.level >= 20) {
    entries.push(
      autoEntry("Palavra de Poder: Matar", "Palavras de Criação"),
      autoEntry("Palavra de Poder: Salvar", "Palavras de Criação"),
    );
  }
  return entries;
}

function autoEntry(name: string, origin: string): SpellPreparedEntry {
  return {
    circle: "",
    name,
    castingTime: "",
    range: "",
    concentration: false,
    ritual: false,
    material: false,
    notes: `Sempre preparada — ${origin}`,
  };
}
