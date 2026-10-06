import type { AbilityKey } from "../domain/common.js";
import type { Character, SpellPreparedEntry } from "../domain/character.js";
import { findSpeciesLineageOption, INFERNAL_LINEAGES } from "../data/speciesLineages.js";
import { getProficiencyBonus } from "./abilities.js";
import { getGnomeOrTieflingLineageSpellcastingAbility } from "./speciesLineage.js";

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

/**
 * Referências de magia concedidas pela ESPÉCIE (Elfo/Gnomo/Tiefling —
 * fonte "IMPLEMENTAR LINHAGENS..." §3): nunca inventamos círculo,
 * descrição, componentes, alcance ou dano — só o que a fonte deu (nome,
 * origem, nível mínimo via o próprio gating de `character.level`,
 * indicação de truque, disponibilidade/usos gratuitos e atributo de
 * conjuração, quando definido). Usa o MESMO formato de
 * `rules/bardAutoPreparedSpells.ts#autoEntry`/`rules/druidAutoPreparedSpells.ts#autoEntry`
 * (circle/castingTime/range sempre "", concentration/ritual/material
 * sempre `false`, tudo em `notes`) — nunca um formato paralelo. Entra
 * em `rules/effectiveSpellsPrepared.ts#getAutoPreparedSpells`, então
 * aparece tanto na Ficha Web/Builder ("Magias Concedidas
 * Automaticamente") quanto no PDF (`spellPreparedFields`), inclusive
 * para personagens cuja classe não tenha conjuração.
 */
export function getSpeciesGrantedSpells(character: Character): SpellPreparedEntry[] {
  if (character.speciesId === "elfo") return getElvenGrantedSpells(character);
  if (character.speciesId === "gnomo") return getGnomishGrantedSpells(character);
  if (character.speciesId === "tiefling") return getInfernalGrantedSpells(character);
  return [];
}

function autoEntry(name: string, notes: string): SpellPreparedEntry {
  return { circle: "", name, castingTime: "", range: "", concentration: false, ritual: false, material: false, notes };
}

function abilityNote(ability: AbilityKey | null): string {
  return ability ? ` Atributo: ${ABILITY_NAMES[ability]}.` : "";
}

function cantripEntry(name: string, origin: string, ability: AbilityKey | null, extra?: string): SpellPreparedEntry {
  const extraNote = extra ? ` ${extra}` : "";
  return autoEntry(name, `Truque conhecido — ${origin}.${extraNote}${abilityNote(ability)}`);
}

function preparedEntry(name: string, origin: string, ability: AbilityKey | null, freeUses: string): SpellPreparedEntry {
  return autoEntry(
    name,
    `Sempre preparada — ${origin}. ${freeUses} sem gasto de espaço por Descanso Longo, ou com espaço de magia apropriado.${abilityNote(ability)}`,
  );
}

/** Alto Elfo / Drow / Elfo da Floresta — truque sempre conhecido + 2 magias sempre preparadas (níveis 3 e 5), 1 uso grátis por DL cada. */
function getElvenGrantedSpells(character: Character): SpellPreparedEntry[] {
  const lineage = findSpeciesLineageOption("elfo", character.speciesLineageId);
  if (!lineage) return [];

  const ability = character.elvenLineageSpellcastingAbility;
  const origin = `Linhagem Élfica — ${lineage.name}`;
  const entries: SpellPreparedEntry[] = [];

  if (lineage.id === "elfo-alto-elfo") {
    entries.push(
      cantripEntry(
        "Prestidigitação",
        origin,
        ability,
        "Pode ser substituído por outro truque de Mago ao terminar um Descanso Longo — substituto aguarda catálogo de magias.",
      ),
    );
    if (character.level >= 3) entries.push(preparedEntry("Detectar Magia", origin, ability, "1x"));
    if (character.level >= 5) entries.push(preparedEntry("Passo Nebuloso", origin, ability, "1x"));
  } else if (lineage.id === "elfo-drow") {
    entries.push(cantripEntry("Luzes Dançantes", origin, ability));
    if (character.level >= 3) entries.push(preparedEntry("Fogo das Fadas", origin, ability, "1x"));
    if (character.level >= 5) entries.push(preparedEntry("Escuridão", origin, ability, "1x"));
  } else if (lineage.id === "elfo-floresta") {
    entries.push(cantripEntry("Druidismo", origin, ability));
    if (character.level >= 3) entries.push(preparedEntry("Passos Largos", origin, ability, "1x"));
    if (character.level >= 5) entries.push(preparedEntry("Passos Sem Pegadas", origin, ability, "1x"));
  }

  return entries;
}

/** Gnomo da Floresta (Ilusão Menor + Falar com Animais, BPx/DL) / Gnomo da Rocha (Remendo + Prestidigitação). */
function getGnomishGrantedSpells(character: Character): SpellPreparedEntry[] {
  const lineage = findSpeciesLineageOption("gnomo", character.speciesLineageId);
  if (!lineage) return [];

  const ability = getGnomeOrTieflingLineageSpellcastingAbility(character);
  const origin = `Linhagem Gnômica — ${lineage.name}`;

  if (lineage.id === "gnomo-floresta") {
    const freeUses = getProficiencyBonus(character.level);
    return [
      cantripEntry("Ilusão Menor", origin, ability),
      preparedEntry("Falar com Animais", origin, ability, `${freeUses}x`),
    ];
  }

  // gnomo-rocha
  return [cantripEntry("Remendo", origin, ability), cantripEntry("Prestidigitação", origin, ability)];
}

/** Taumaturgia (sempre, qualquer linhagem) + truque/magias da Linhagem Infernal escolhida. */
function getInfernalGrantedSpells(character: Character): SpellPreparedEntry[] {
  const lineage = findSpeciesLineageOption("tiefling", character.speciesLineageId);
  if (!lineage) return [];

  const ability = getGnomeOrTieflingLineageSpellcastingAbility(character);
  const infernal = INFERNAL_LINEAGES.find((option) => option.id === lineage.id);
  if (!infernal) return [];

  const origin = `Linhagem Infernal — ${infernal.name}`;
  const entries: SpellPreparedEntry[] = [
    cantripEntry("Taumaturgia", "Tiefling", ability),
    cantripEntry(infernal.cantripLevel1, origin, ability),
  ];
  if (character.level >= 3) entries.push(preparedEntry(infernal.spellLevel3, origin, ability, "1x"));
  if (character.level >= 5) entries.push(preparedEntry(infernal.spellLevel5, origin, ability, "1x"));
  return entries;
}
