import type { Character, SpellPreparedEntry } from "../domain/character.js";

/**
 * Magias concedidas automaticamente ao Feiticeiro — pelas 4
 * subclasses (listas sempre preparadas por nível). Vão para a área de
 * Magias do PDF (`spellsPrepared`), nunca para "Características de
 * Classe" (fonte "INTEGRAÇÃO COMPLETA — FEITICEIRO, METAMAGIA E
 * SUBCLASSES"). Feitiçaria Psiônica (nível 6+, Aberrante) e
 * Companheiro Dracônico (nível 18+, Dracônica) não concedem magia
 * nova — só modificam as notas das magias já sempre preparadas
 * (Magias Psiônicas / Invocar Dragão), nunca um bloco impresso
 * separado.
 *
 * Círculo real de cada magia não foi fornecido pela fonte — não
 * inventado; fica em branco, com a origem/condições registradas em
 * `notes` (mesmo padrão de `rules/warlockAutoPreparedSpells.ts`).
 */

function autoEntry(name: string, notes: string): SpellPreparedEntry {
  return { circle: "", name, castingTime: "", range: "", concentration: false, ritual: false, material: false, notes };
}

const ABERRANT_SPELLS: { level: number; names: string[] }[] = [
  { level: 3, names: ["Acalmar Emoções", "Braços de Hadar", "Detectar Pensamentos", "Sussurros Dissonantes", "Talho Mental"] },
  { level: 5, names: ["Fome de Hadar", "Remeter"] },
  { level: 7, names: ["Invocar Aberração", "Tentáculos Negros de Evard"] },
  { level: 9, names: ["Ligação Telepática de Rary", "Telecinese"] },
];

const DRACONIC_SPELLS: { level: number; names: string[] }[] = [
  { level: 3, names: ["Alterar-se", "Comando", "Orbe Cromático", "Sopro de Dragão"] },
  { level: 5, names: ["Medo", "Voo"] },
  { level: 7, names: ["Enfeitiçar Monstro", "Olho Arcano"] },
  { level: 9, names: ["Invocar Dragão", "Lendas e Histórias"] },
];

const MECHANICAL_SPELLS: { level: number; names: string[] }[] = [
  { level: 3, names: ["Alarme", "Auxílio", "Proteção Contra o Bem e o Mal", "Restauração Menor"] },
  { level: 5, names: ["Dissipar Magia", "Proteção contra Energia"] },
  { level: 7, names: ["Invocar Constructo", "Movimentação Livre"] },
  { level: 9, names: ["Muralha de Energia", "Restauração Maior"] },
];

function pushTierSpells(entries: SpellPreparedEntry[], tiers: { level: number; names: string[] }[], level: number, origin: string): void {
  for (const tier of tiers) {
    if (level < tier.level) continue;
    for (const name of tier.names) entries.push(autoEntry(name, `Sempre preparada — ${origin}`));
  }
}

export function getSorcererAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "feiticeiro") return [];

  const entries: SpellPreparedEntry[] = [];

  if (character.subclassId === "Feitiçaria Aberrante") {
    const psionicNoteSuffix =
      character.level >= 6 ? "; Feitiçaria Psiônica: pode conjurar com PF = círculo, sem V/S, M só custo/consumido" : "";
    for (const tier of ABERRANT_SPELLS) {
      if (character.level < tier.level) continue;
      for (const name of tier.names) entries.push(autoEntry(name, `Sempre preparada — Feitiçaria Aberrante${psionicNoteSuffix}`));
    }
  }

  if (character.subclassId === "Feitiçaria Dracônica") {
    for (const tier of DRACONIC_SPELLS) {
      if (character.level < tier.level) continue;
      for (const name of tier.names) {
        const isSummonDragon = name === "Invocar Dragão" && character.level >= 18;
        entries.push(
          autoEntry(
            name,
            isSummonDragon
              ? "Sempre preparada — Feitiçaria Dracônica; Companheiro Dracônico: sem Material, 1x sem espaço/DL; pode ser sem Concent, duração 1 min"
              : "Sempre preparada — Feitiçaria Dracônica",
          ),
        );
      }
    }
  }

  if (character.subclassId === "Feitiçaria Mecânica") {
    pushTierSpells(entries, MECHANICAL_SPELLS, character.level, "Feitiçaria Mecânica");
  }

  return entries;
}
