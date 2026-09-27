import { create } from "zustand";
import type { AbilityKey } from "../domain/common.js";
import {
  createBlankCharacter,
  type ArmorProficiencies,
  type Character,
} from "../domain/character.js";
import type { ArmorId, BackgroundId, ClassId, SizeId, SkillKey, SpeciesId, SpellCircle } from "../domain/ids.js";
import { classes } from "../data/classes.js";
import { getAvailableArmor } from "../rules/armor.js";
import { getAvailableSubclasses } from "../rules/subclasses.js";
import { getSpellSlots } from "../rules/spellcasting.js";

/**
 * Store central do personagem em construção.
 *
 * Regra de ouro (reforçada nesta etapa): o store guarda SOMENTE inputs
 * e ajustes manuais — o mesmo formato de `Character` usado pelo motor
 * de regras. Nenhuma ação aqui calcula um valor derivado; quando uma
 * ação precisa decidir se uma escolha ainda é válida (ex.: subclasse
 * some ao trocar de classe), ela consulta as funções de `rules/`
 * (`getAvailableSubclasses`, `getAvailableArmor`, `getSpellSlots`) —
 * nunca reimplementa a lógica.
 */

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `char-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Se a armadura equipada não estiver mais entre as disponíveis, volta para "unarmed" — nunca escolhe outra em nome do jogador. */
function clampEquippedArmor(character: Character): Character {
  if (character.armor.equipped === "unarmed") return character;
  const stillAvailable = getAvailableArmor(character).some((a) => a.id === character.armor.equipped);
  if (stillAvailable) return character;
  return { ...character, armor: { ...character.armor, equipped: "unarmed" } };
}

/** Nunca deixa `expended` maior que o total de espaços disponível naquele círculo. */
function clampSpellSlotsExpended(character: Character): Character {
  const totals = getSpellSlots(character);
  let changed = false;
  const slots = { ...character.spellcasting.slots };
  for (const circle of Object.keys(slots).map(Number) as SpellCircle[]) {
    const total = totals[circle];
    const current = slots[circle];
    if (current.expended > total) {
      slots[circle] = { expended: total };
      changed = true;
    }
  }
  if (!changed) return character;
  return { ...character, spellcasting: { ...character.spellcasting, slots } };
}

/**
 * Efeitos colaterais da troca de classe, extraídos do comportamento do
 * PDF original: zera TODAS as salvaguardas e proficiências de armadura
 * e marca só as da nova classe. Isso permanece seguro porque, neste
 * sistema sem multiclasse, a classe é a ÚNICA fonte dessas duas
 * proficiências (ao contrário das perícias, cuja proficiência final
 * agora é sempre derivada via `getSkillProficiency` — ver
 * `setBackground` abaixo, que não precisa mais tocar em `skills`). A
 * subclasse é limpa se não pertencer à nova classe; a armadura
 * equipada é limpa se deixar de ser permitida.
 */
function applyClassChange(character: Character, classId: ClassId | null): Character {
  const savingThrows = { ...character.savingThrows };
  for (const ability of Object.keys(savingThrows) as AbilityKey[]) {
    savingThrows[ability] = { ...savingThrows[ability], proficient: false };
  }

  let armorProficiencies: ArmorProficiencies = { light: false, medium: false, heavy: false, shield: false };

  if (classId) {
    const definition = classes[classId];
    for (const ability of definition.savingThrowProficiencies) {
      savingThrows[ability] = { ...savingThrows[ability], proficient: true };
    }
    armorProficiencies = { ...definition.armorProficiencies };
  }

  const subclassStillValid = classId !== null && getAvailableSubclasses(classId).some((s) => s.fullName === character.subclassId);

  let next: Character = {
    ...character,
    classId,
    subclassId: subclassStillValid ? character.subclassId : null,
    savingThrows,
    armor: { ...character.armor, proficiencies: armorProficiencies },
  };

  next = clampEquippedArmor(next);
  next = clampSpellSlotsExpended(next);
  return next;
}

interface CharacterStore {
  character: Character;

  setName: (name: string) => void;
  setLevel: (level: number) => void;
  setClass: (classId: ClassId | null) => void;
  setSubclass: (subclassId: string | null) => void;
  setSpecies: (speciesId: SpeciesId | null) => void;
  setBackground: (backgroundId: BackgroundId | null) => void;

  setAbilityScore: (ability: AbilityKey, score: number) => void;

  setSkillManualOverride: (skill: SkillKey, value: boolean | null) => void;
  setSkillExpertise: (skill: SkillKey, expertise: boolean) => void;
  setSkillManualAdjustment: (skill: SkillKey, value: number) => void;

  setSavingThrowProficient: (ability: AbilityKey, proficient: boolean) => void;
  setSavingThrowManualAdjustment: (ability: AbilityKey, value: number) => void;

  setInitiativeManualAdjustment: (value: number) => void;
  setPassivePerceptionManualAdjustment: (value: number) => void;

  setSizeManualOverride: (size: SizeId | null) => void;
  setSpeedManualAdjustment: (value: number) => void;

  setArmorEquipped: (armorId: ArmorId | "unarmed") => void;
  setShield: (equipped: boolean) => void;
  setArmorProficiency: (category: keyof ArmorProficiencies, value: boolean) => void;
  setArmorManualAdjustment: (value: number) => void;

  setSpellSaveDCManualAdjustment: (value: number) => void;
  setSpellAttackBonusManualAdjustment: (value: number) => void;
  setSpellSlotExpended: (circle: SpellCircle, expended: number) => void;

  setWeaponProficienciesNotes: (notes: string) => void;
  setToolProficienciesNotes: (notes: string) => void;
  setSpeciesTraitsNotes: (notes: string) => void;
  setTalentsNotes: (notes: string) => void;

  /** Começa um personagem inteiramente novo (novo id anônimo, portanto um novo build de analytics). */
  resetCharacter: () => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  character: createBlankCharacter(generateId()),

  setName: (name) => set((state) => ({ character: { ...state.character, name } })),

  setLevel: (level) =>
    set((state) => ({ character: clampSpellSlotsExpended({ ...state.character, level }) })),

  setClass: (classId) => set((state) => ({ character: applyClassChange(state.character, classId) })),

  setSubclass: (subclassId) =>
    set((state) => ({ character: clampSpellSlotsExpended({ ...state.character, subclassId }) })),

  setSpecies: (speciesId) => set((state) => ({ character: { ...state.character, speciesId } })),

  /**
   * Trocar de antecedente é agora uma escrita trivial: nenhuma perícia
   * precisa ser marcada/desmarcada aqui. `getSkillProficiency` (em
   * `rules/skills.ts`) já recalcula sozinha quais perícias o
   * antecedente ATUAL concede; qualquer `manualOverride` que o
   * jogador tenha definido continua intocado, seja qual for o
   * antecedente (ver §1.1 do pedido: Nobre → Soldado troca as
   * proficiências automáticas sem apagar escolhas manuais).
   */
  setBackground: (backgroundId) => set((state) => ({ character: { ...state.character, backgroundId } })),

  setAbilityScore: (ability, score) =>
    set((state) => ({
      character: { ...state.character, abilities: { ...state.character.abilities, [ability]: { score } } },
    })),

  setSkillManualOverride: (skill, value) =>
    set((state) => ({
      character: {
        ...state.character,
        skills: { ...state.character.skills, [skill]: { ...state.character.skills[skill], manualOverride: value } },
      },
    })),

  setSkillExpertise: (skill, expertise) =>
    set((state) => ({
      character: {
        ...state.character,
        skills: { ...state.character.skills, [skill]: { ...state.character.skills[skill], expertise } },
      },
    })),

  setSkillManualAdjustment: (skill, value) =>
    set((state) => ({
      character: {
        ...state.character,
        skills: { ...state.character.skills, [skill]: { ...state.character.skills[skill], manualAdjustment: value } },
      },
    })),

  setSavingThrowProficient: (ability, proficient) =>
    set((state) => ({
      character: {
        ...state.character,
        savingThrows: { ...state.character.savingThrows, [ability]: { ...state.character.savingThrows[ability], proficient } },
      },
    })),

  setSavingThrowManualAdjustment: (ability, value) =>
    set((state) => ({
      character: {
        ...state.character,
        savingThrows: {
          ...state.character.savingThrows,
          [ability]: { ...state.character.savingThrows[ability], manualAdjustment: value },
        },
      },
    })),

  setInitiativeManualAdjustment: (value) =>
    set((state) => ({ character: { ...state.character, initiative: { manualAdjustment: value } } })),

  setPassivePerceptionManualAdjustment: (value) =>
    set((state) => ({ character: { ...state.character, passivePerception: { manualAdjustment: value } } })),

  setSizeManualOverride: (size) => set((state) => ({ character: { ...state.character, size: { manualOverride: size } } })),

  setSpeedManualAdjustment: (value) =>
    set((state) => ({ character: { ...state.character, speed: { manualAdjustment: value } } })),

  setArmorEquipped: (armorId) =>
    set((state) => ({ character: { ...state.character, armor: { ...state.character.armor, equipped: armorId } } })),

  setShield: (equipped) =>
    set((state) => ({ character: { ...state.character, armor: { ...state.character.armor, shield: equipped } } })),

  setArmorProficiency: (category, value) =>
    set((state) => {
      const proficiencies = { ...state.character.armor.proficiencies, [category]: value };
      const next = { ...state.character, armor: { ...state.character.armor, proficiencies } };
      return { character: clampEquippedArmor(next) };
    }),

  setArmorManualAdjustment: (value) =>
    set((state) => ({ character: { ...state.character, armor: { ...state.character.armor, manualAdjustment: value } } })),

  setSpellSaveDCManualAdjustment: (value) =>
    set((state) => ({
      character: { ...state.character, spellcasting: { ...state.character.spellcasting, manualSaveDCAdjustment: value } },
    })),

  setSpellAttackBonusManualAdjustment: (value) =>
    set((state) => ({
      character: { ...state.character, spellcasting: { ...state.character.spellcasting, manualAttackBonusAdjustment: value } },
    })),

  setSpellSlotExpended: (circle, expended) =>
    set((state) => ({
      character: {
        ...state.character,
        spellcasting: {
          ...state.character.spellcasting,
          slots: { ...state.character.spellcasting.slots, [circle]: { expended } },
        },
      },
    })),

  setWeaponProficienciesNotes: (notes) => set((state) => ({ character: { ...state.character, weaponProficienciesNotes: notes } })),
  setToolProficienciesNotes: (notes) => set((state) => ({ character: { ...state.character, toolProficienciesNotes: notes } })),
  setSpeciesTraitsNotes: (notes) => set((state) => ({ character: { ...state.character, speciesTraitsNotes: notes } })),
  setTalentsNotes: (notes) => set((state) => ({ character: { ...state.character, talentsNotes: notes } })),

  resetCharacter: () => set({ character: createBlankCharacter(generateId()) }),
}));
