import type { AbilityKey } from "../domain/common.js";
import type { BackgroundId, ClassId, SpeciesId } from "../domain/ids.js";

/** O que o usuário já escolheu até agora — quanto mais preenchido, mais específica a análise pode tentar ser (ver §10). */
export interface InsightContext {
  classId?: ClassId;
  subclassId?: string;
  speciesId?: SpeciesId;
  backgroundId?: BackgroundId;
  level?: number;
  /** Qual atributo é o maior do PRÓPRIO personagem em edição (derivado, nunca escolhido diretamente pelo jogador) — ver §1.2. */
  highestAbility?: AbilityKey;
}

export type InsightMetric =
  | "subclassPopularity"
  | "speciesPopularity"
  | "backgroundPopularity"
  | "armorPopularity"
  | "abilityHighest";

export interface ChoiceInsightItem {
  /** Rótulo legível (ex.: "Evocador", "Halfling", "Peitoral", "Inteligência"). */
  label: string;
  /** 0–100, arredondado. */
  percentage: number;
}

/**
 * Um insight = "padrão observado descritivo" — nunca uma recomendação
 * (ver §5/§17: reporta o que outros usuários fizeram, não conclui
 * qual escolha é objetivamente melhor). `kind` distingue de
 * `"ruleTip"` (dica de regra do próprio D&D, sem base estatística),
 * que é um sistema futuro e não deve nunca ser confundido com este
 * (ver §12).
 */
export interface ChoiceInsight {
  /** Chave estável — usada para não repetir a mesma dica na mesma sessão (ver ui/insights). */
  id: string;
  kind: "communityInsight";
  metric: InsightMetric;
  /** Descreve a população analisada, ex.: "Magos de nível 5 a 8 registrados". Nunca aparece um percentual sem esta frase por perto. */
  scopeLabel: string;
  /** Quantos builds sustentam esta conclusão — sempre >= MIN_SAMPLE_SIZE (ver insightRules.ts). */
  sampleSize: number;
  /** Sempre ordenado do mais para o menos frequente. */
  items: ChoiceInsightItem[];
}

/**
 * Tamanho mínimo de amostra para QUALQUER insight ser apresentado.
 * Abaixo disso, `getChoiceInsights` simplesmente omite aquele insight
 * (nunca inventa percentual, nunca bloqueia a criação — ver §11/§12).
 */
export const MIN_SAMPLE_SIZE = 20;
