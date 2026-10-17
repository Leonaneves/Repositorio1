import type { AbilityKey } from "./common.js";
import type { BackgroundId, ClassId, SkillKey, SpeciesId } from "./ids.js";
import type { WeaponCategory, WeaponRangeKind } from "../data/weapons.js";
import type { ToolCategory } from "../data/tools.js";

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
  /** `excludeAlreadyProficient` filtra, na hora de exibir, as perícias em que o personagem já é proficiente por qualquer outra fonte (ex.: Conhecimento Primordial do Bárbaro, §6 — nunca oferece uma perícia repetida). */
  | { kind: "skillProficiency"; options: SkillKey[] | "any"; count: number; excludeAlreadyProficient?: boolean }
  /**
   * Especialização (Expertise) em perícias nas quais o personagem JÁ é
   * proficiente — nunca concede a proficiência em si, só dobra o bônus
   * (ex.: "Especialista" do Bardo, fonte "INTEGRAÇÃO COMPLETA — BARDO E
   * SUBCLASSES" §4). A UI filtra as opções pelas perícias atualmente
   * proficientes. `options`, quando presente, restringe ainda mais a um
   * conjunto fechado (ex.: "Acadêmico" do Mago, fonte "IMPLEMENTAR MAGO
   * E SUAS SUBCLASSES NO BUILDER E NO PDF" §5 — só Arcanismo/História/
   * Investigação/Medicina/Natureza/Religião); omitido = qualquer
   * perícia proficiente (comportamento original, nunca alterado para
   * quem já usava este efeito sem `options`).
   */
  | { kind: "skillExpertise"; count: number; options?: SkillKey[] }
  /** `category` filtra as opções elegíveis pelo catálogo estruturado (`data/tools.ts#getEligibleTools`) — nunca mais texto livre (fonte "REORGANIZAÇÃO DO BUILDER" §4). */
  | { kind: "toolProficiency"; category: ToolCategory | ToolCategory[]; count: number }
  /**
   * Reserva ÚNICA de `count` escolhas combinando QUALQUER perícia E
   * QUALQUER ferramenta/instrumento da(s) categoria(s) informada(s) —
   * nunca dois limites independentes de `count` cada (ex.: "Habilidoso",
   * fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E NO PDF" §2: "duas
   * perícias e uma ferramenta completam a concessão, nunca três de
   * cada"). Única `FeatureChoice`, então o controle próprio
   * (`ui/builder/FeatureChoiceControl.tsx`) é quem mistura as duas
   * listas de opções — nunca dividido em duas escolhas (`skillProficiency`
   * + `toolProficiency`) que precisariam de validação cruzada de
   * contagem.
   */
  | { kind: "skillOrToolProficiency"; toolCategory: ToolCategory | ToolCategory[]; count: number }
  /**
   * Aumento de 1 num atributo à escolha, limitado a 20 (fonte "COMPLETAR
   * TALENTOS GERAIS NO BUILDER E NO PDF" §1) — todos os 26 Talentos
   * Gerais deste lote têm exatamente UMA escolha deste tipo. `options`
   * é a lista fixa de atributos elegíveis (1, 2, 3 ou os 6) — exceto
   * Resiliente, cujas opções são recalculadas por personagem (só
   * atributos ainda sem proficiência em Salvaguarda, nunca uma lista
   * estática — ver `rules/feats.ts#buildFeatAcquisitionFeature`). O
   * limite de 20 é aplicado na LEITURA (`rules/abilities.ts#getEffectiveAbilityScore`
   * soma `rules/feats.ts#getFeatAbilityIncreaseBonus`, nunca reduzindo um
   * valor já acima de 20 por outra fonte — só limita a CONTRIBUIÇÃO desta
   * escolha), nunca na escrita. A checagem de pré-requisito de atributo
   * (`rules/feats.ts#meetsFeatPrerequisites`) sempre exclui a
   * CONTRIBUIÇÃO da própria aquisição sendo validada — nunca permite que
   * o aumento concedido cumpra seu próprio pré-requisito (fonte §1).
   */
  | { kind: "abilityScoreIncrease"; options: AbilityKey[] }
  /**
   * Escolha ÚNICA entre um conjunto fixo de perícias que concede
   * Proficiência OU Especialização, dependendo do estado ATUAL da
   * perícia escolhida — nunca as duas como escolhas separadas (ex.:
   * "Mente Aguçada", fonte "COMPLETAR TALENTOS GERAIS NO BUILDER E NO
   * PDF" §9: "se não possuir proficiência, concedê-la; se já possuir,
   * conceder Especialização"). Resolvido em `rules/skills.ts` (nunca em
   * `skillExpertise`/`skillProficiency`, que têm semântica fixa) —
   * revalidado a cada leitura, nunca uma decisão travada no momento da
   * escolha (se outra fonte passar a conceder a mesma perícia depois, a
   * escolha vira Especialização automaticamente, sem exigir nova seleção).
   */
  | { kind: "skillProficiencyOrExpertise"; options: SkillKey[] }
  /** `rangeKind` filtra por alcance (corpo a corpo/à distância) além da categoria simples/marcial — ex.: Maestria em Arma do Bárbaro, só corpo a corpo (§3). */
  | { kind: "weaponPicker"; category: WeaponCategory | "any"; count: number; rangeKind?: WeaponRangeKind }
  /** Escolha única entre um pequeno conjunto de opções nomeadas (ex.: "Armadura de Couro Batido" OU "Cota de Escamas" do equipamento inicial do Artífice) — quando as opções não pertencem a nenhum catálogo existente (perícia/ferramenta/arma), mas ainda são uma lista fechada e conhecida, não texto livre. */
  | { kind: "optionPick"; options: string[] }
  /**
   * `manualText` é TAMBÉM o modelo usado hoje para Estilo de Luta — uma
   * CATEGORIA de talento condicional (fonte "IMPLEMENTAR SUBCLASSES DO
   * GUERREIRO NO BUILDER E NO PDF" §2), nunca disponível em seleções
   * gerais de talento: só pode ser adquirido por uma característica que
   * concede especificamente essa categoria (ex.: "Estilo de Luta" do
   * Guerreiro nível 1, "Estilo de Luta Adicional" do Campeão nível 7).
   * Possuir uma dessas características NUNCA concede todos os Estilos
   * de Luta de uma vez — cada característica concedente é sua PRÓPRIA
   * `FeatureDefinition`/`FeatureChoice`, com origem e quantidade (1
   * escolha) independentes das demais; a de outras classes (Paladino,
   * Patrulheiro etc., ainda pendentes) nunca é tocada por esta fonte.
   * Catálogo de Estilos de Luta ainda não fornecido — por isso
   * `manualText` (nunca um texto livre validado como escolha
   * completa — `rules/features.ts#isFeatureChoiceComplete` trata
   * `manualText` como sempre incompleto o suficiente para nunca travar
   * o Avançar, e NUNCA suficiente para contar como talento adquirido).
   * Quando o catálogo chegar, cada concessão desta categoria deve
   * passar a validar quantidade/requisitos contra ele — nunca contra
   * uma lista geral de talentos.
   */
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
