import type { AbilityKey } from "./common.js";
import type { BackgroundId, ClassId, SkillKey, SpeciesId } from "./ids.js";
import type { WeaponCategory } from "../data/weapons.js";

/** De onde a feature vem — usado para agrupar/etiquetar na UI (Ficha Web e Builder). */
export type FeatureSourceType = "class" | "subclass" | "species" | "background" | "feat";

export type FeatureUsesFormula =
  | { kind: "fixed"; value: number }
  | { kind: "proficiencyBonus" }
  | { kind: "abilityModifier"; ability: AbilityKey };

export type FeatureRecharge = "descansoCurto" | "descansoLongo" | "diario" | "nenhum";

export interface FeatureUses {
  formula: FeatureUsesFormula;
  recharge: FeatureRecharge;
}

/**
 * Efeito de uma escolha exigida por uma feature. `manualText` é o
 * fallback aprovado para quando ainda não existe catálogo estruturado
 * para o tipo de escolha (ex.: magias — decisão de escopo §7) — nunca
 * inventamos opções, só abrimos um campo de texto claramente marcado
 * como entrada manual.
 */
export type FeatureChoiceEffect =
  | { kind: "skillProficiency"; options: SkillKey[] | "any"; count: number }
  | { kind: "toolProficiency"; optionsText: string; count: number }
  | { kind: "weaponPicker"; category: WeaponCategory | "any"; count: number }
  /** Escolha única entre um pequeno conjunto de opções nomeadas (ex.: "Armadura de Couro Batido" OU "Cota de Escamas" do equipamento inicial do Artífice) — quando as opções não pertencem a nenhum catálogo existente (perícia/ferramenta/arma), mas ainda são uma lista fechada e conhecida, não texto livre. */
  | { kind: "optionPick"; options: string[] }
  | { kind: "manualText"; placeholder: string };

export interface FeatureChoice {
  id: string;
  prompt: string;
  effect: FeatureChoiceEffect;
}

export interface FeatureDefinition {
  id: string;
  name: string;
  sourceType: FeatureSourceType;
  /** Nível de aquisição (classe/subclasse). `null` = não depende de nível (espécie/antecedente/talento avulso). */
  level: number | null;
  classId?: ClassId;
  /** Valor de exportação da subclasse — mesma convenção de `Character.subclassId`. */
  subclassFullName?: string;
  speciesId?: SpeciesId;
  backgroundId?: BackgroundId;
  /** true = concedida automaticamente pela fonte; false = precisa ser escolhida entre opções (ex.: talento geral em ASI). */
  autoGranted: boolean;
  /** Resumo mecânico curto, em texto próprio (nunca cópia literal de livro) — ver `rules/features.ts#getFeatureView`. */
  summary: string;
  uses?: FeatureUses;
  choices?: FeatureChoice[];
}

/** Resposta do jogador a um `FeatureChoice` — chave é `FeatureChoice.id`. */
export interface FeatureChoiceSelection {
  value: string | string[];
}

/** Visão pronta para exibição (Ficha Web/Builder/PDF) — combina dado computável + texto explicativo. */
export interface FeatureView {
  id: string;
  name: string;
  sourceType: FeatureSourceType;
  originLabel: string;
  summary: string;
  uses?: FeatureUses;
  choices?: FeatureChoice[];
}
