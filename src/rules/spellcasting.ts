import { computedValue, type AbilityKey, type ComputedValue } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { SPELL_CIRCLES, type CasterProgressionType, type ClassId, type SpellCircle } from "../domain/ids.js";
import { classes } from "../data/classes.js";
import { SUBCLASS_SPELLCASTERS } from "../data/subclasses.js";
import { backgrounds } from "../data/backgrounds.js";
import { FULL_CASTER_SLOT_TABLE, PACT_MAGIC_TABLE } from "../data/spellProgression.js";
import { getAbilityModifier, getProficiencyBonus } from "./abilities.js";

/**
 * Tipo de progressão de conjurador efetiva, considerando a subclasse
 * (Guerreiro/Cavaleiro Místico e Ladino/Trapaceiro Arcano só se tornam
 * "third" a partir do nível em que a subclasse concede conjuração).
 */
export function getCasterProgressionType(
  classId: ClassId | null,
  subclassId: string | null,
  level: number,
): CasterProgressionType {
  if (!classId) return "none";

  const subclassGrant = SUBCLASS_SPELLCASTERS.find((s) => s.classId === classId && s.fullName === subclassId);
  if (subclassGrant && level >= subclassGrant.grantedFromLevel) {
    return "third";
  }

  return classes[classId].casterKind;
}

/**
 * Atributo de conjuração. Ordem de resolução:
 *
 * 1. Subclasse conjuradora (Cavaleiro Místico / Trapaceiro Arcano) → sempre INTELIGÊNCIA.
 * 2. Atributo de conjuração da própria classe, se houver.
 * 3. Antecedente que concede conjuração via talento "Iniciado em Magia"
 *    (Acólito/Guia/Sábio) — **apenas** quando a classe escolhida não
 *    tiver atributo de conjuração próprio (ex.: Guerreiro, Monge,
 *    Bárbaro), por decisão explícita do projeto. Não concede espaços de
 *    magia (ver `getSpellSlots`), só serve de base para CD/ataque
 *    mágico do truque/magia do talento.
 * 4. Caso nenhuma das condições acima se aplique, não há conjuração (`null`).
 */
export function getSpellcastingAbility(character: Character): AbilityKey | null {
  if (!character.classId) return null;

  const subclassGrant = SUBCLASS_SPELLCASTERS.find(
    (s) => s.classId === character.classId && s.fullName === character.subclassId,
  );
  if (subclassGrant) return "INT";

  const classAbility = classes[character.classId].spellcastingAbility;
  if (classAbility) return classAbility;

  if (character.backgroundId) {
    const backgroundAbility = backgrounds[character.backgroundId].grantsSpellcastingAbility;
    if (backgroundAbility) return backgroundAbility;
  }

  return null;
}

export function getSpellcastingModifier(character: Character): number | null {
  const ability = getSpellcastingAbility(character);
  if (!ability) return null;
  return getAbilityModifier(character.abilities[ability].score);
}

/** CD de magia = 8 + bônus de proficiência + modificador de conjuração + ajuste manual. */
export function getSpellSaveDC(character: Character): ComputedValue | null {
  const modifier = getSpellcastingModifier(character);
  if (modifier === null) return null;

  const proficiencyBonus = getProficiencyBonus(character.level);
  const auto = 8 + proficiencyBonus + modifier;
  return computedValue(auto, character.spellcasting.manualSaveDCAdjustment);
}

/** Bônus de ataque mágico = bônus de proficiência + modificador de conjuração + ajuste manual. */
export function getSpellAttackBonus(character: Character): ComputedValue | null {
  const modifier = getSpellcastingModifier(character);
  if (modifier === null) return null;

  const proficiencyBonus = getProficiencyBonus(character.level);
  const auto = proficiencyBonus + modifier;
  return computedValue(auto, character.spellcasting.manualAttackBonusAdjustment);
}

function emptySlots(): Record<SpellCircle, number> {
  return Object.fromEntries(SPELL_CIRCLES.map((circle) => [circle, 0])) as Record<SpellCircle, number>;
}

/**
 * Espaços de magia TOTAIS por círculo (não descontam os já gastos —
 * isso fica em `character.spellcasting.slots[circle].expended`).
 *
 * Importante: ao contrário do atributo/CD/ataque mágico, a conjuração
 * concedida por antecedente (talento "Iniciado em Magia") NUNCA gera
 * espaços de magia aqui — é um sistema à parte (magia gratuita
 * limitada, tipicamente 1x por Descanso Longo), fora do escopo desta
 * fase. Esta função só produz espaços a partir da CLASSE/SUBCLASSE.
 */
export function getSpellSlots(character: Character): Record<SpellCircle, number> {
  if (!character.classId) return emptySlots();

  const progressionType = getCasterProgressionType(character.classId, character.subclassId, character.level);

  if (progressionType === "pact") {
    const pact = PACT_MAGIC_TABLE[character.level];
    const result = emptySlots();
    if (pact && pact.slotCircle > 0) {
      result[pact.slotCircle as SpellCircle] = pact.slotCount;
    }
    return result;
  }

  let casterLevel: number;
  if (progressionType === "full") {
    casterLevel = character.level;
  } else if (progressionType === "half") {
    casterLevel = Math.ceil(character.level / 2);
  } else if (progressionType === "third") {
    casterLevel = Math.ceil(character.level / 3);
  } else {
    return emptySlots();
  }

  const row = FULL_CASTER_SLOT_TABLE[casterLevel];
  if (!row) return emptySlots();

  const result = emptySlots();
  SPELL_CIRCLES.forEach((circle, index) => {
    result[circle] = row[index] ?? 0;
  });
  return result;
}
