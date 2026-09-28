import type { AbilityKey } from "../domain/common.js";
import { CLASS_IDS, type ClassId, type SkillKey } from "../domain/ids.js";

export type CasterKind = "full" | "half" | "pact" | "none";

/** Faces do Dado de Vida da classe (ex.: Bárbaro = 12 → "d12"). */
export type HitDie = 6 | 8 | 10 | 12;

/**
 * Escolha de perícias de CLASSE (ex.: "escolha 2 entre Atletismo,
 * Intimidação..."), aprovada na base consolidada de classes — nunca
 * proficiência automática. `from: "any"` é o caso do Bardo ("escolha
 * quaisquer 3 perícias"). Vira uma `FeatureChoice` real
 * (`data/features/classes.ts`), resolvida do mesmo jeito que qualquer
 * outra escolha de feature (`rules/skills.ts#isSkillGrantedByClassChoice`).
 */
export interface ClassSkillChoice {
  count: number;
  from: SkillKey[] | "any";
}

/**
 * Uma opção de equipamento inicial (A/B/C). Itens ficam em texto livre
 * — não existe ainda catálogo de kits/armaduras/instrumentos (só o de
 * armas, `data/weapons.ts`) — por isso não são referências
 * estruturadas a outro catálogo, mas a ESCOLHA em si (qual opção) é
 * estruturada e utilizável pelo Builder.
 */
export interface StartingEquipmentOption {
  id: string;
  items: string[];
  /** PO adicional dessa opção (isolado, nunca somado a itens — ex.: opção B costuma ser só ouro). */
  gold: number;
}

export interface ClassDefinition {
  id: ClassId;
  name: string;
  /** Aprovado na etapa de PV/Dados de Vida — não alterar sem confirmação. */
  hitDie: HitDie;
  /** Texto livre (pode ser mais de um atributo, ex.: Paladino = "Força e Carisma") — não é necessariamente igual a `spellcastingAbility`. */
  primaryAbilityText: string | null;
  spellcastingAbility: AbilityKey | null;
  savingThrowProficiencies: [AbilityKey, AbilityKey];
  armorProficiencies: { light: boolean; medium: boolean; heavy: boolean; shield: boolean };
  weaponProficiencyText: string;
  toolProficiencyText: string | null;
  /** `undefined` = ainda não confirmado com fonte (ex.: Artífice) — nunca inventado. */
  skillChoice?: ClassSkillChoice;
  /** `undefined` = ainda não confirmado com fonte. */
  startingEquipment?: StartingEquipmentOption[];
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
    // primaryAbilityText/skillChoice/startingEquipment: pendentes — Artífice não fazia parte da base consolidada de classes fornecida.
    primaryAbilityText: null,
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
    primaryAbilityText: "Força",
    spellcastingAbility: null,
    savingThrowProficiencies: ["FOR", "CON"],
    armorProficiencies: { light: true, medium: true, heavy: false, shield: true },
    weaponProficiencyText: "Armas Simples e Marciais",
    toolProficiencyText: null,
    skillChoice: { count: 2, from: ["atletismo", "intimidacao", "lidarComAnimais", "natureza", "percepcao", "sobrevivencia"] },
    startingEquipment: [
      { id: "A", items: ["4 Machadinhas", "Machado Grande", "Kit de Aventureiro"], gold: 15 },
      { id: "B", items: [], gold: 75 },
    ],
    casterKind: "none",
  },
  bardo: {
    id: "bardo",
    name: "Bardo",
    hitDie: 8,
    primaryAbilityText: "Carisma",
    spellcastingAbility: "CAR",
    savingThrowProficiencies: ["DEX", "CAR"],
    armorProficiencies: { light: true, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: "3 Instrumentos Musicais à escolha",
    skillChoice: { count: 3, from: "any" },
    startingEquipment: [
      { id: "A", items: ["Armadura de Couro", "2 Adagas", "Instrumento Musical à sua escolha", "Kit de Artista"], gold: 19 },
      { id: "B", items: [], gold: 90 },
    ],
    casterKind: "full",
  },
  bruxo: {
    id: "bruxo",
    name: "Bruxo",
    hitDie: 8,
    primaryAbilityText: "Carisma",
    spellcastingAbility: "CAR",
    savingThrowProficiencies: ["SAB", "CAR"],
    armorProficiencies: { light: true, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: null,
    skillChoice: { count: 2, from: ["arcanismo", "enganacao", "historia", "intimidacao", "investigacao", "natureza", "religiao"] },
    startingEquipment: [
      {
        id: "A",
        items: ["Armadura de Couro", "Foice", "2 Adagas", "Foco Arcano (orbe)", "Livro (conhecimento oculto)", "Kit de Erudito"],
        gold: 15,
      },
      { id: "B", items: [], gold: 100 },
    ],
    casterKind: "pact",
  },
  clerigo: {
    id: "clerigo",
    name: "Clérigo",
    hitDie: 8,
    primaryAbilityText: "Sabedoria",
    spellcastingAbility: "SAB",
    savingThrowProficiencies: ["SAB", "CAR"],
    armorProficiencies: { light: true, medium: true, heavy: false, shield: true },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: null,
    skillChoice: { count: 2, from: ["historia", "intuicao", "medicina", "persuasao", "religiao"] },
    startingEquipment: [
      { id: "A", items: ["Cota de Malha Parcial", "Escudo", "Maça", "Símbolo Sagrado", "Kit de Sacerdote"], gold: 7 },
      { id: "B", items: [], gold: 110 },
    ],
    casterKind: "full",
  },
  druida: {
    id: "druida",
    name: "Druida",
    hitDie: 8,
    primaryAbilityText: "Sabedoria",
    spellcastingAbility: "SAB",
    savingThrowProficiencies: ["INT", "SAB"],
    armorProficiencies: { light: true, medium: false, heavy: false, shield: true },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: "Kit de Herbalismo",
    skillChoice: {
      count: 2,
      from: ["arcanismo", "lidarComAnimais", "intuicao", "medicina", "natureza", "percepcao", "religiao", "sobrevivencia"],
    },
    startingEquipment: [
      {
        id: "A",
        items: ["Armadura de Couro", "Escudo", "Foice", "Foco Druídico (Cajado)", "Kit de Explorador", "Kit de Herbalismo"],
        gold: 9,
      },
      { id: "B", items: [], gold: 50 },
    ],
    casterKind: "full",
  },
  feiticeiro: {
    id: "feiticeiro",
    name: "Feiticeiro",
    hitDie: 6,
    primaryAbilityText: "Carisma",
    spellcastingAbility: "CAR",
    savingThrowProficiencies: ["CON", "CAR"],
    armorProficiencies: { light: false, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: null,
    skillChoice: { count: 2, from: ["arcanismo", "enganacao", "intimidacao", "intuicao", "persuasao", "religiao"] },
    startingEquipment: [
      { id: "A", items: ["Lança", "2 Adagas", "Foco Arcano (cristal)", "Kit de Explorador de Masmorras"], gold: 28 },
      { id: "B", items: [], gold: 50 },
    ],
    casterKind: "full",
  },
  guerreiro: {
    id: "guerreiro",
    name: "Guerreiro",
    hitDie: 10,
    primaryAbilityText: "Força ou Destreza",
    spellcastingAbility: null,
    savingThrowProficiencies: ["FOR", "CON"],
    armorProficiencies: { light: true, medium: true, heavy: true, shield: true },
    weaponProficiencyText: "Armas Simples e Marciais",
    toolProficiencyText: null,
    skillChoice: {
      count: 2,
      from: ["acrobacia", "atletismo", "historia", "intimidacao", "intuicao", "lidarComAnimais", "percepcao", "persuasao", "sobrevivencia"],
    },
    startingEquipment: [
      { id: "A", items: ["Cota de Malha", "Espada Grande", "Mangual", "8 Azagaias", "Kit de Explorador de Masmorras"], gold: 4 },
      {
        id: "B",
        items: ["Armadura de Couro Batido", "Cimitarra", "Espada Curta", "Arco Longo", "20 Flechas", "Aljava", "Kit de Explorador de Masmorras"],
        gold: 11,
      },
      { id: "C", items: [], gold: 155 },
    ],
    casterKind: "none",
  },
  ladino: {
    id: "ladino",
    name: "Ladino",
    hitDie: 8,
    primaryAbilityText: "Destreza",
    spellcastingAbility: null,
    savingThrowProficiencies: ["DEX", "INT"],
    armorProficiencies: { light: true, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples e Armas Marciais com propriedade Acuidade ou Leve",
    toolProficiencyText: "Ferramentas de Ladrão",
    skillChoice: {
      count: 4,
      from: ["acrobacia", "atletismo", "enganacao", "furtividade", "intimidacao", "intuicao", "investigacao", "percepcao", "persuasao", "prestidigitacao"],
    },
    startingEquipment: [
      {
        id: "A",
        items: ["Armadura de Couro", "2 Adagas", "Espada Curta", "Arco Curto", "20 Flechas", "Aljava", "Ferramentas de Ladrão", "Kit de Assaltante"],
        gold: 8,
      },
      { id: "B", items: [], gold: 100 },
    ],
    casterKind: "none",
  },
  mago: {
    id: "mago",
    name: "Mago",
    hitDie: 6,
    primaryAbilityText: "Inteligência",
    spellcastingAbility: "INT",
    savingThrowProficiencies: ["INT", "SAB"],
    armorProficiencies: { light: false, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples",
    toolProficiencyText: null,
    skillChoice: { count: 2, from: ["arcanismo", "historia", "intuicao", "investigacao", "medicina", "natureza", "religiao"] },
    startingEquipment: [
      { id: "A", items: ["2 Adagas", "Foco Arcano (Cajado)", "Kit de Erudito", "Livro de Magias", "Túnica"], gold: 5 },
      { id: "B", items: [], gold: 55 },
    ],
    casterKind: "full",
  },
  monge: {
    id: "monge",
    name: "Monge",
    hitDie: 8,
    primaryAbilityText: "Destreza e Sabedoria",
    spellcastingAbility: null,
    savingThrowProficiencies: ["FOR", "DEX"],
    armorProficiencies: { light: false, medium: false, heavy: false, shield: false },
    weaponProficiencyText: "Armas Simples e Armas Marciais com propriedade Leve",
    toolProficiencyText: "1 Ferramenta de Artesão ou Instrumento Musical à escolha",
    skillChoice: { count: 2, from: ["acrobacia", "atletismo", "furtividade", "historia", "intuicao", "religiao"] },
    startingEquipment: [
      { id: "A", items: ["Lança", "5 Adagas", "Ferramenta de Artesão ou Instrumento Musical escolhido", "Kit de Aventureiro"], gold: 11 },
      { id: "B", items: [], gold: 50 },
    ],
    casterKind: "none",
  },
  paladino: {
    id: "paladino",
    name: "Paladino",
    hitDie: 10,
    primaryAbilityText: "Força e Carisma",
    spellcastingAbility: "CAR",
    savingThrowProficiencies: ["SAB", "CAR"],
    armorProficiencies: { light: true, medium: true, heavy: true, shield: true },
    weaponProficiencyText: "Armas Simples e Marciais",
    toolProficiencyText: null,
    skillChoice: { count: 2, from: ["atletismo", "intimidacao", "intuicao", "medicina", "persuasao", "religiao"] },
    startingEquipment: [
      { id: "A", items: ["Cota de Malha", "Escudo", "Espada Longa", "6 Azagaias", "Símbolo Sagrado", "Kit de Sacerdote"], gold: 9 },
      { id: "B", items: [], gold: 150 },
    ],
    casterKind: "half",
  },
  patrulheiro: {
    id: "patrulheiro",
    name: "Patrulheiro",
    hitDie: 10,
    primaryAbilityText: "Destreza e Sabedoria",
    spellcastingAbility: "SAB",
    savingThrowProficiencies: ["FOR", "DEX"],
    armorProficiencies: { light: true, medium: true, heavy: false, shield: true },
    weaponProficiencyText: "Armas Simples e Marciais",
    toolProficiencyText: null,
    skillChoice: {
      count: 3,
      from: ["atletismo", "furtividade", "intuicao", "investigacao", "lidarComAnimais", "natureza", "percepcao", "sobrevivencia"],
    },
    startingEquipment: [
      {
        id: "A",
        items: [
          "Armadura de Couro Batido",
          "Cimitarra",
          "Espada Curta",
          "Arco Longo",
          "20 Flechas",
          "Aljava",
          "Foco Druídico (ramo de visco)",
          "Kit de Aventureiro",
        ],
        gold: 7,
      },
      { id: "B", items: [], gold: 150 },
    ],
    casterKind: "half",
  },
};

export const classList: ClassDefinition[] = CLASS_IDS.map((id) => classes[id]);

/** Id estável da escolha de perícias de classe — usado tanto pela feature (data/features/classes.ts) quanto por rules/skills.ts para ler a seleção do jogador. */
export function getClassSkillChoiceId(classId: ClassId): string {
  return `classe-${classId}-pericias`;
}
