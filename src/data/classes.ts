import type { AbilityKey } from "../domain/common.js";
import { CLASS_IDS, type ClassId } from "../domain/ids.js";

export type CasterKind = "full" | "half" | "pact" | "none";

/** Faces do Dado de Vida da classe (ex.: Bárbaro = 12 → "d12"). */
export type HitDie = 6 | 8 | 10 | 12;

export interface ClassDefinition {
  id: ClassId;
  name: string;
  /** Aprovado na etapa de PV/Dados de Vida — não alterar sem confirmação. */
  hitDie: HitDie;
  spellcastingAbility: AbilityKey | null;
  savingThrowProficiencies: [AbilityKey, AbilityKey];
  armorProficiencies: { light: boolean; medium: boolean; heavy: boolean; shield: boolean };
  weaponProficiencyText: string;
  toolProficiencyText: string | null;
  /**
   * Tipo de progressão de conjurador da CLASSE em si. Guerreiro e Ladino
   * são "none" aqui — a conjuração deles vem exclusivamente da subclasse
   * (Cavaleiro Místico / Trapaceiro Arcano), tratada à parte em
   * `rules/spellcasting.ts` e `data/subclasses.ts`.
   */
  casterKind: CasterKind;
}

/**
 * As 13 classes do escopo, com efeitos colaterais extraídos literalmente
 * do script `CLASSE` do PDF original (atributo de conjuração,
 * salvaguardas, proficiências de armadura, texto de armas/ferramentas).
 */
export const classes: Record<ClassId, ClassDefinition> = {
  artifice: {
    id: "artifice",
    name: "Artífice",
    hitDie: 8,
    spellcastingAbility: "INT",
    savingThrowProficiencies: ["CON", "INT"],
    armorProficiencies: { light: true, medium: true, heavy: false, shield: true },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: "Ferramentas de Ladrão\nFerramentas de Funileiro\n1 Ferramenta de Artesão à escolha",
    casterKind: "half",
  },
  barbaro: {
    id: "barbaro",
    name: "Bárbaro",
    hitDie: 12,
    spellcastingAbility: null,
    savingThrowProficiencies: ["FOR", "CON"],
    armorProficiencies: { light: true, medium: true, heavy: false, shield: true },
    weaponProficiencyText: "Armas Simples e Marciais",
    toolProficiencyText: null,
    casterKind: "none",
  },
  bardo: {
    id: "bardo",
    name: "Bardo",
    hitDie: 8,
    spellcastingAbility: "CAR",
    savingThrowProficiencies: ["DEX", "CAR"],
    armorProficiencies: { light: true, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: "3 Instrumentos Musicais à escolha",
    casterKind: "full",
  },
  bruxo: {
    id: "bruxo",
    name: "Bruxo",
    hitDie: 8,
    spellcastingAbility: "CAR",
    savingThrowProficiencies: ["SAB", "CAR"],
    armorProficiencies: { light: true, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: null,
    casterKind: "pact",
  },
  clerigo: {
    id: "clerigo",
    name: "Clérigo",
    hitDie: 8,
    spellcastingAbility: "SAB",
    savingThrowProficiencies: ["SAB", "CAR"],
    armorProficiencies: { light: true, medium: true, heavy: false, shield: true },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: null,
    casterKind: "full",
  },
  druida: {
    id: "druida",
    name: "Druida",
    hitDie: 8,
    spellcastingAbility: "SAB",
    savingThrowProficiencies: ["INT", "SAB"],
    armorProficiencies: { light: true, medium: false, heavy: false, shield: true },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: "Kit de Herbalismo",
    casterKind: "full",
  },
  feiticeiro: {
    id: "feiticeiro",
    name: "Feiticeiro",
    hitDie: 6,
    spellcastingAbility: "CAR",
    savingThrowProficiencies: ["CON", "CAR"],
    armorProficiencies: { light: false, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: null,
    casterKind: "full",
  },
  guerreiro: {
    id: "guerreiro",
    name: "Guerreiro",
    hitDie: 10,
    spellcastingAbility: null,
    savingThrowProficiencies: ["FOR", "CON"],
    armorProficiencies: { light: true, medium: true, heavy: true, shield: true },
    weaponProficiencyText: "Armas Simples e Marciais",
    toolProficiencyText: null,
    casterKind: "none",
  },
  ladino: {
    id: "ladino",
    name: "Ladino",
    hitDie: 8,
    spellcastingAbility: null,
    savingThrowProficiencies: ["DEX", "INT"],
    armorProficiencies: { light: true, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples e Armas Marciais com propriedade Acuidade ou Leve",
    toolProficiencyText: "Ferramentas de Ladrão",
    casterKind: "none",
  },
  mago: {
    id: "mago",
    name: "Mago",
    hitDie: 6,
    spellcastingAbility: "INT",
    savingThrowProficiencies: ["INT", "SAB"],
    armorProficiencies: { light: false, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: null,
    casterKind: "full",
  },
  monge: {
    id: "monge",
    name: "Monge",
    hitDie: 8,
    spellcastingAbility: null,
    savingThrowProficiencies: ["FOR", "DEX"],
    armorProficiencies: { light: false, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples e Armas Marciais com propriedade Leve",
    toolProficiencyText: "1 Ferramenta de Artesão ou Instrumento Musical à escolha",
    casterKind: "none",
  },
  paladino: {
    id: "paladino",
    name: "Paladino",
    hitDie: 10,
    spellcastingAbility: "CAR",
    savingThrowProficiencies: ["SAB", "CAR"],
    armorProficiencies: { light: true, medium: true, heavy: true, shield: true },
    weaponProficiencyText: "Armas Simples e Marciais",
    toolProficiencyText: null,
    casterKind: "half",
  },
  patrulheiro: {
    id: "patrulheiro",
    name: "Patrulheiro",
    hitDie: 10,
    spellcastingAbility: "SAB",
    savingThrowProficiencies: ["FOR", "DEX"],
    armorProficiencies: { light: true, medium: true, heavy: false, shield: true },
    weaponProficiencyText: "Armas Simples e Marciais",
    toolProficiencyText: null,
    casterKind: "half",
  },
};

export const classList: ClassDefinition[] = CLASS_IDS.map((id) => classes[id]);
