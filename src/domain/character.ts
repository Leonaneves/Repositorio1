import { ABILITY_KEYS, type AbilityKey } from "./common.js";
import { SKILL_KEYS, type ArmorId, type BackgroundId, type ClassId, type SizeId, type SkillKey, type SpeciesId, type SpellCircle } from "./ids.js";

export interface AbilityScoreState {
  /** Valor bruto do atributo (1–30), entrada manual do jogador. */
  score: number;
}

export interface SkillState {
  /** Proficiência marcada (herdada do antecedente, mas sempre editável). */
  proficient: boolean;
  /** Perícia com especialização (dobra o bônus de proficiência). Só é válida se `proficient` for `true`. */
  expertise: boolean;
  /** Ajuste manual somado ao bônus automático. */
  manualAdjustment: number;
}

export interface SavingThrowState {
  /** Proficiência marcada (herdada da classe, mas sempre editável). */
  proficient: boolean;
  manualAdjustment: number;
}

export type ProficiencyTextSource = "class" | "species" | "background";

/** Uma entrada de texto auto-gerada a partir de uma origem do personagem — NUNCA armazenada em `Character` (ver nota abaixo). */
export interface AutoTextEntry {
  text: string;
  source: ProficiencyTextSource;
}

export interface ArmorProficiencies {
  light: boolean;
  medium: boolean;
  heavy: boolean;
  shield: boolean;
}

/** Item de ataque manual (nome/bônus/dano/notas livres) — ver decisão de escopo na §7.5 da arquitetura. */
export interface AttackEntry {
  name: string;
  attackBonus: string;
  damage: string;
  notes: string;
}

export interface SpellSlotState {
  /** Espaços gastos (marcados manualmente pelo jogador durante o jogo). O total é sempre derivado pelo motor de regras, nunca armazenado aqui. */
  expended: number;
}

export interface SpellPreparedEntry {
  circle: string;
  name: string;
  castingTime: string;
  range: string;
  concentration: boolean;
  ritual: boolean;
  material: boolean;
  notes: string;
}

export interface Character {
  id: string;
  name: string;

  level: number; // 1–20
  classId: ClassId | null;
  /** Valor de exportação/canônico da subclasse (ex.: "Cavaleiro Místico"), ou null se ainda não escolhida. */
  subclassId: string | null;
  speciesId: SpeciesId | null;
  backgroundId: BackgroundId | null;

  abilities: Record<AbilityKey, AbilityScoreState>;

  skills: Record<SkillKey, SkillState>;
  savingThrows: Record<AbilityKey, SavingThrowState>;

  initiative: { manualAdjustment: number };
  passivePerception: { manualAdjustment: number };

  /** Tamanho: sobrescrito automaticamente a cada troca de espécie, mas sempre editável (override, não soma). */
  size: { manualOverride: SizeId | null };
  /** Deslocamento em metros: auto (espécie + classe/nível) + ajuste manual. */
  speed: { manualAdjustment: number };

  armor: {
    equipped: ArmorId | "unarmed";
    shield: boolean;
    proficiencies: ArmorProficiencies;
    manualAdjustment: number;
  };

  spellcasting: {
    manualSaveDCAdjustment: number;
    manualAttackBonusAdjustment: number;
    slots: Record<SpellCircle, SpellSlotState>;
  };

  /**
   * Notas manuais que acompanham os blocos de texto auto-gerados
   * (proficiência de armas/ferramentas, traços de espécie, talento de
   * origem). As partes AUTOMÁTICAS desses blocos NÃO ficam guardadas
   * aqui — são sempre recalculadas a partir de `classId`/`speciesId`/
   * `backgroundId` pelas funções de `rules/proficiencyText.ts`
   * (`getClassWeaponProficiencyEntries` etc.). Isso é o que a
   * arquitetura pede: o Character guarda só input/ajuste manual, nunca
   * um resultado derivado gravado "como se fosse" input — e evita por
   * completo a técnica frágil de diff de string do PDF original.
   */
  weaponProficienciesNotes: string;
  toolProficienciesNotes: string;
  speciesTraitsNotes: string;
  talentsNotes: string;

  classFeatures: { column1: string; column2: string };

  attacks: AttackEntry[];

  hp: { current: number; max: number; temp: number; hitDiceMax: number; hitDiceSpent: number };
  deathSaves: { successes: number; failures: number };
  heroicInspiration: boolean;

  spellsPrepared: SpellPreparedEntry[];

  inventory: {
    equipment: string;
    coins: { cp: number; sp: number; gp: number; pp: number };
    attunedItems: { description: string; attuned: boolean }[];
  };

  appearance: string;
  languages: string;
}

/** Cria um personagem em branco, pronto para ser preenchido pela UI/estado (fora do escopo desta etapa). */
export function createBlankCharacter(id: string): Character {
  const abilities = Object.fromEntries(
    ABILITY_KEYS.map((key) => [key, { score: 10 }]),
  ) as Record<AbilityKey, AbilityScoreState>;

  const skills = Object.fromEntries(
    SKILL_KEYS.map((key) => [key, { proficient: false, expertise: false, manualAdjustment: 0 }]),
  ) as Record<SkillKey, SkillState>;

  const savingThrows = Object.fromEntries(
    ABILITY_KEYS.map((key) => [key, { proficient: false, manualAdjustment: 0 }]),
  ) as Record<AbilityKey, SavingThrowState>;

  const slots = Object.fromEntries(
    [1, 2, 3, 4, 5, 6, 7, 8, 9].map((circle) => [circle, { expended: 0 }]),
  ) as Record<SpellCircle, SpellSlotState>;

  return {
    id,
    name: "",
    level: 1,
    classId: null,
    subclassId: null,
    speciesId: null,
    backgroundId: null,
    abilities,
    skills,
    savingThrows,
    initiative: { manualAdjustment: 0 },
    passivePerception: { manualAdjustment: 0 },
    size: { manualOverride: null },
    speed: { manualAdjustment: 0 },
    armor: {
      equipped: "unarmed",
      shield: false,
      proficiencies: { light: false, medium: false, heavy: false, shield: false },
      manualAdjustment: 0,
    },
    spellcasting: {
      manualSaveDCAdjustment: 0,
      manualAttackBonusAdjustment: 0,
      slots,
    },
    weaponProficienciesNotes: "",
    toolProficienciesNotes: "",
    speciesTraitsNotes: "",
    talentsNotes: "",
    classFeatures: { column1: "", column2: "" },
    attacks: [],
    hp: { current: 0, max: 0, temp: 0, hitDiceMax: 0, hitDiceSpent: 0 },
    deathSaves: { successes: 0, failures: 0 },
    heroicInspiration: false,
    spellsPrepared: [],
    inventory: { equipment: "", coins: { cp: 0, sp: 0, gp: 0, pp: 0 }, attunedItems: [] },
    appearance: "",
    languages: "",
  };
}
