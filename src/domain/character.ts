import { ABILITY_KEYS, type AbilityKey } from "./common.js";
import { SKILL_KEYS, type ArmorId, type BackgroundId, type ClassId, type SizeId, type SkillKey, type SpeciesId, type SpellCircle } from "./ids.js";
import type { FeatureChoiceSelection } from "./features.js";

export interface AbilityScoreState {
  /** Valor bruto do atributo (1–30), entrada manual do jogador. */
  score: number;
}

/**
 * Uma escolha de "Aumento no Valor de Atributo" (fonte "REORGANIZAÇÃO
 * DO BUILDER" §22/§29) — cada nível de ASI (4/8/12/16/19 conforme a
 * classe) tem sua PRÓPRIA instância, guardada em `Character.asiSelections`
 * por nível. `abilityIncrease.allocations` usa o mesmo componente
 * genérico de distribuição de `rules/abilityAllocation.ts` (2 pontos
 * totais, máximo +2 por atributo — `ASI_ALLOCATION_CONFIG`). `feat` não
 * guarda nenhum id: o catálogo de Talentos ainda não existe (§27 —
 * nunca inventado), então escolher "Talento" já é a decisão completa
 * por ora.
 */
export type AsiSelection = { kind: "abilityIncrease"; allocations: Partial<Record<AbilityKey, number>> } | { kind: "feat" };

export interface SkillState {
  /**
   * Override explícito do jogador sobre a proficiência: `null` =
   * segue o antecedente atual (`rules/skills.ts#isSkillGrantedByBackground`);
   * `true`/`false` = decisão manual, que sobrevive a trocas de
   * antecedente (ver `rules/skills.ts#getSkillProficiency` — a
   * proficiência final é sempre derivada, nunca lida diretamente
   * daqui).
   */
  manualOverride: boolean | null;
  /** Perícia com especialização (dobra o bônus de proficiência). Só é válida se a proficiência final for `true`. */
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

  /**
   * PV máximo é derivado (ver `rules/hp.ts#getMaxHitPoints`): aqui só o
   * ajuste manual sobrevive, nunca o total calculado. `hitDiceMax`
   * também é sempre derivado (1 por nível) — não é armazenado.
   */
  hp: { current: number; maxManualAdjustment: number; temp: number; hitDiceSpent: number };
  deathSaves: { successes: number; failures: number };
  heroicInspiration: boolean;

  spellsPrepared: SpellPreparedEntry[];

  inventory: {
    equipment: string;
    coins: { cp: number; sp: number; gp: number; pp: number };
    attunedItems: { description: string; attuned: boolean }[];
  };

  /**
   * Qual `StartingEquipmentOption.id` (A/B/C) o jogador escolheu para
   * o equipamento inicial da classe atual — `null` enquanto não
   * escolhido. Escolher preenche `inventory.equipment`/`coins.gp`
   * (ver `state/characterStore.ts#setStartingEquipmentOption`); troca
   * de classe limpa este campo (as opções são específicas da classe).
   */
  startingEquipmentOptionId: string | null;

  appearance: string;
  languages: string;

  /**
   * Respostas a escolhas de feature (`FeatureChoice.id` → seleção do
   * jogador) e talentos gerais escolhidos pelo jogador (ids de
   * `FeatureDefinition` com `sourceType: "feat"`). Ver `rules/features.ts`
   * — a lista de features em si nunca é armazenada aqui, só as escolhas;
   * `getCharacterFeatures` sempre recalcula a partir de
   * classId/subclassId/speciesId/backgroundId/level + estes campos.
   */
  featureChoiceSelections: Record<string, FeatureChoiceSelection>;
  chosenFeatIds: string[];

  /**
   * Invocações Místicas do Bruxo escolhidas (etapa própria do Builder,
   * fora de `featureChoiceSelections` porque a quantidade/elegibilidade
   * dependem de pré-requisitos cruzados entre invocações — ver
   * `rules/invocations.ts`). `subChoice` é a sub-escolha em texto livre
   * exigida por algumas invocações (Truque afetado, Talento de Origem)
   * — nunca validada contra um catálogo (nenhum catálogo de magias/
   * truques existe no projeto, mesma decisão já aprovada para Bardo).
   * Repetível = pode aparecer mais de uma vez em `chosenInvocations`,
   * com `subChoice` diferente em cada ocorrência.
   */
  chosenInvocations: ChosenInvocation[];

  /** Formas Conhecidas de Forma Selvagem do Druida — ver `KnownWildShapeForm`. */
  knownWildShapeForms: KnownWildShapeForm[];

  /**
   * Opções de Metamagia conhecidas do Feiticeiro (ids de
   * `data/metamagic.ts#metamagicOptions`) — etapa própria do Builder,
   * fora de `featureChoiceSelections` pelo mesmo motivo de
   * `chosenInvocations`/`knownWildShapeForms`: a quantidade exigida
   * varia por nível e nunca pode haver duplicata, o que não cabe no
   * modelo genérico de `FeatureChoice`.
   */
  knownMetamagicOptions: string[];

  /**
   * Bônus de atributo do Antecedente ATUAL (fonte "REORGANIZAÇÃO DO
   * BUILDER" §12/§19/§20) — distribuição própria, separada da pontuação
   * base (`abilities[ability].score`) e de qualquer outra fonte, para
   * nunca acumular bônus de forma destrutiva ao editar (§18). Trocar de
   * Antecedente limpa este campo por completo (`state/characterStore.ts#setBackground`)
   * — nunca soma o bônus do Antecedente antigo ao novo (§39).
   */
  backgroundAbilityBonuses: Partial<Record<AbilityKey, number>>;

  /**
   * Escolhas de "Aumento no Valor de Atributo" por nível (ex.: `{4: {...}, 8: {...}}`)
   * — ver `AsiSelection`. Cada instância é independente (§29); trocar de
   * classe ou baixar o nível remove as entradas que deixarem de existir
   * na progressão (`state/characterStore.ts#setClass`/`setLevel`).
   */
  asiSelections: Record<number, AsiSelection>;

  /**
   * Linhagem/Ancestralidade da espécie ATUAL (Draconato/Elfo/Gnomo/
   * Golias/Tiefling — fonte "IMPLEMENTAR LINHAGENS E ANCESTRALIDADES
   * NA ETAPA ESPÉCIE") — id estável entre as opções de
   * `data/speciesLineages.ts#getSpeciesLineageOptions`. `null` enquanto
   * não escolhida, ou para qualquer espécie sem linhagem (as outras 5).
   * Trocar de espécie limpa este campo (`state/characterStore.ts#setSpecies`)
   * — nunca acumula a linhagem antiga com a nova.
   */
  speciesLineageId: string | null;

  /**
   * Override manual (Homebrew) das Ferramentas/Instrumentos conhecidos
   * — `null` = segue o resultado automático da escolha estruturada de
   * "Ferramentas de Classe" (`rules/tools.ts#getAutomaticClassTools`);
   * um array = modo Homebrew ativo, substitui por completo o resultado
   * automático (nunca soma), mas nunca destrói os dados automáticos —
   * voltar a `null` restaura o resultado calculado pelas regras (fonte
   * "REORGANIZAÇÃO DO BUILDER" §5).
   */
  manualToolOverrides: string[] | null;
}

export interface ChosenInvocation {
  invocationId: string;
  /** "" quando a invocação não exige sub-escolha ou ainda não foi preenchida. */
  subChoice: string;
}

/**
 * Uma Forma Conhecida de Forma Selvagem do Druida (fonte "INTEGRAÇÃO
 * COMPLETA — DRUIDA E SUBCLASSES" §8) — etapa própria do Builder, fora
 * de `featureChoiceSelections` pelo mesmo motivo de `chosenInvocations`
 * (quantidade/validade dependem de regras cruzadas — nível, ND máximo,
 * restrição de Voo — não cabem no modelo genérico de `FeatureChoice`).
 * Não existe catálogo de Feras no projeto (mesma decisão "nunca
 * inventar catálogo" já aplicada a magias): `name` é texto livre, mas
 * `challengeRating`/`hasFlySpeed` são campos estruturados que o
 * Builder PODE validar (contagem/ND/Voo) sem precisar de um catálogo —
 * confiamos no jogador para preenchê-los corretamente, igual à
 * confiança já dada ao nome de uma magia manual.
 */
export interface KnownWildShapeForm {
  name: string;
  /** Texto livre no formato da fonte: "1/4", "1/2", "1", "2" etc. — ver rules/wildShapeForms.ts#parseChallengeRating. */
  challengeRating: string;
  hasFlySpeed: boolean;
}

/** Cria um personagem em branco, pronto para ser preenchido pela UI/estado (fora do escopo desta etapa). */
export function createBlankCharacter(id: string): Character {
  const abilities = Object.fromEntries(
    ABILITY_KEYS.map((key) => [key, { score: 10 }]),
  ) as Record<AbilityKey, AbilityScoreState>;

  const skills = Object.fromEntries(
    SKILL_KEYS.map((key) => [key, { manualOverride: null, expertise: false, manualAdjustment: 0 }]),
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
    hp: { current: 0, maxManualAdjustment: 0, temp: 0, hitDiceSpent: 0 },
    deathSaves: { successes: 0, failures: 0 },
    heroicInspiration: false,
    spellsPrepared: [],
    inventory: { equipment: "", coins: { cp: 0, sp: 0, gp: 0, pp: 0 }, attunedItems: [] },
    startingEquipmentOptionId: null,
    appearance: "",
    languages: "",
    featureChoiceSelections: {},
    chosenFeatIds: [],
    chosenInvocations: [],
    knownWildShapeForms: [],
    knownMetamagicOptions: [],
    backgroundAbilityBonuses: {},
    asiSelections: {},
    manualToolOverrides: null,
    speciesLineageId: null,
  };
}
