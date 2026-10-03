import type { Character, SpellPreparedEntry } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";
import { ORDEM_PRIMAL_CHOICE_ID, XAMA_TRUQUE_CHOICE_ID } from "../data/features/druid.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID } from "../data/features/subclasses.js";

/**
 * Magias concedidas automaticamente ao Druida — Idioma Druídico
 * (Falar com Animais), Companheiro Selvagem (Convocar Familiar),
 * Magias de Círculo das 3 subclasses que têm lista fixa (Lua/Terra,
 * conforme terreno atual/Mar), Mapa Estelar (Círculo das Estrelas) e o
 * Truque extra de Xamã (Ordem Primal). Vão para a área de Magias do
 * PDF (`spellsPrepared`), nunca para "Características de Classe" — por
 * isso ficam de fora de `rules/druidPrintedFeatures.ts`/
 * `druidSubclassPrintedFeatures.ts` (fonte "INTEGRAÇÃO COMPLETA —
 * DRUIDA E SUBCLASSES").
 *
 * Círculo das Estrelas não tem lista fixa de Magias de Círculo — só
 * Mapa Estelar (Orientação + Raio Guia), por isso não aparece no mapa
 * `DOMAIN_SPELLS_BY_LEVEL` abaixo.
 */

function autoEntry(name: string, notes: string): SpellPreparedEntry {
  return { circle: "", name, castingTime: "", range: "", concentration: false, ritual: false, material: false, notes };
}

const MOON_CIRCLE_SPELLS: { level: number; names: string[] }[] = [
  { level: 3, names: ["Curar Ferimentos", "Fagulha Estelar", "Raio Lunar"] },
  { level: 5, names: ["Invocar Animais"] },
  { level: 7, names: ["Fonte do Luar"] },
  { level: 9, names: ["Curar Ferimentos em Massa"] },
];

const SEA_CIRCLE_SPELLS: { level: number; names: string[] }[] = [
  { level: 3, names: ["Despedaçar", "Lufada de Vento", "Névoa Obscurecente", "Onda Trovejante", "Raio de Gelo"] },
  { level: 5, names: ["Relâmpago", "Respirar na Água"] },
  { level: 7, names: ["Controlar Água", "Tempestade Glacial"] },
  { level: 9, names: ["Invocar Elemental", "Paralisar Monstro"] },
];

const EARTH_CIRCLE_SPELLS_BY_TERRAIN: Record<string, { level: number; names: string[] }[]> = {
  Árido: [
    { level: 3, names: ["Mãos Flamejantes", "Raio de Fogo", "Turvar"] },
    { level: 5, names: ["Bola de Fogo"] },
    { level: 7, names: ["Malogro"] },
    { level: 9, names: ["Muralha de Pedra"] },
  ],
  Polar: [
    { level: 3, names: ["Névoa Obscurecente", "Paralisar Pessoa", "Raio de Gelo"] },
    { level: 5, names: ["Nevasca"] },
    { level: 7, names: ["Tempestade Glacial"] },
    { level: 9, names: ["Cone de Frio"] },
  ],
  Temperado: [
    { level: 3, names: ["Passo Nebuloso", "Sono", "Toque Chocante"] },
    { level: 5, names: ["Relâmpago"] },
    { level: 7, names: ["Movimentação Livre"] },
    { level: 9, names: ["Passo Arbóreo"] },
  ],
  Tropical: [
    { level: 3, names: ["Bolha Ácida", "Raio Nauseante", "Teia"] },
    { level: 5, names: ["Nuvem Fétida"] },
    { level: 7, names: ["Polimorfia"] },
    { level: 9, names: ["Praga de Insetos"] },
  ],
};

function pushTierSpells(entries: SpellPreparedEntry[], tiers: { level: number; names: string[] }[], level: number, origin: string): void {
  for (const tier of tiers) {
    if (level < tier.level) continue;
    for (const name of tier.names) entries.push(autoEntry(name, `Sempre preparada — ${origin}`));
  }
}

export function getDruidAutoPreparedSpells(character: Character): SpellPreparedEntry[] {
  if (character.classId !== "druida") return [];

  const entries: SpellPreparedEntry[] = [];

  if (character.level >= 1) {
    entries.push(autoEntry("Falar com Animais", "Sempre preparada — Idioma Druídico; sem espaço"));
  }

  if (character.level >= 2) {
    entries.push(
      autoEntry("Convocar Familiar", "Sempre preparada — Companheiro Selvagem; custo: 1 espaço OU 1 FS; sem Material; familiar Feérico; desaparece no DL"),
    );
  }

  if (character.subclassId === "Círculo da Lua") {
    pushTierSpells(entries, MOON_CIRCLE_SPELLS, character.level, "Círculo da Lua; pode conjurar em FS");
  }

  if (character.subclassId === "Círculo da Terra") {
    const terrain = character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID]?.value;
    const tiers = typeof terrain === "string" ? EARTH_CIRCLE_SPELLS_BY_TERRAIN[terrain] : undefined;
    if (tiers) pushTierSpells(entries, tiers, character.level, `Círculo da Terra (${terrain})`);
  }

  if (character.subclassId === "Círculo do Mar") {
    pushTierSpells(entries, SEA_CIRCLE_SPELLS, character.level, "Círculo do Mar");
  }

  if (character.subclassId === "Círculo das Estrelas" && character.level >= 3) {
    const wisdomMod = getAbilityModifier(getEffectiveAbilityScore(character, "SAB"));
    const freeUses = Math.max(1, wisdomMod);
    entries.push(autoEntry("Orientação", "Sempre preparada — Mapa Estelar; sem espaço"));
    entries.push(autoEntry("Raio Guia", `Sempre preparada — Mapa Estelar; ${freeUses}x/DL sem gastar espaço`));
  }

  const thaumaturgeCantrip = character.featureChoiceSelections[XAMA_TRUQUE_CHOICE_ID]?.value;
  if (
    character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID]?.value === "Xamã" &&
    typeof thaumaturgeCantrip === "string" &&
    thaumaturgeCantrip.trim().length > 0
  ) {
    entries.push(autoEntry(thaumaturgeCantrip.trim(), "Sempre preparado — Ordem Primal (Xamã); Truque extra de Druida"));
  }

  return entries;
}
