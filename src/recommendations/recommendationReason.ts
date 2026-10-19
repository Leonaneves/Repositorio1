import type { ClassId } from "../domain/ids.js";

/**
 * Motivo de UMA opção recomendada, exibido abaixo do seletor (pedido do
 * usuário: "escolhido por x de 10 {classe}", para ficar mais fácil de
 * entender a proporção). `characters` = personagens distintos que
 * fizeram a escolha; `sampleCharacters` = personagens comparados.
 * `source` separa jogadores reais de personagens de referência — uma
 * referência nunca é descrita como escolha de jogadores.
 */
export interface RecommendationReason {
  characters: number;
  sampleCharacters: number;
  source: "user" | "reference";
}

/** Opções recomendadas de UM seletor → motivo, na ordem do ranking. Vazio = sem recomendação. */
export type RecommendationReasons = ReadonlyMap<string, RecommendationReason>;

export const NO_RECOMMENDATIONS: RecommendationReasons = new Map();

const CLASS_PLURAL: Record<ClassId, string> = {
  artifice: "artífices",
  barbaro: "bárbaros",
  bardo: "bardos",
  bruxo: "bruxos",
  clerigo: "clérigos",
  druida: "druidas",
  feiticeiro: "feiticeiros",
  guerreiro: "guerreiros",
  ladino: "ladinos",
  mago: "magos",
  monge: "monges",
  paladino: "paladinos",
  patrulheiro: "patrulheiros",
};

/**
 * Proporção sempre "de 10": com exatamente 10 personagens comparados,
 * "X de 10"; com mais, a proporção equivalente "de cada 10" — "cerca
 * de" quando arredondada (nunca "10 de cada 10" se alguém escolheu
 * outra coisa, nunca "0" para quem escolheu: "menos de 1").
 */
export function formatProportionOfTen(characters: number, sampleCharacters: number): string {
  if (sampleCharacters === 10) return `${characters} de 10`;
  const scaled = (characters * 10) / sampleCharacters;
  if (Number.isInteger(scaled)) return `${scaled} de cada 10`;
  if (scaled < 1) return "menos de 1 de cada 10";
  return `cerca de ${Math.min(9, Math.round(scaled))} de cada 10`;
}

/**
 * Ex.: "escolhido por 7 de 10 guerreiros", "o maior atributo de cerca de
 * 6 de cada 10 magos", "escolhido por 2 de cada 10 bardos de referência
 * (guias e fontes externas)".
 */
export function formatRecommendationReason(reason: RecommendationReason, classId: ClassId, verb = "escolhido por"): string {
  const group = reason.source === "user" ? CLASS_PLURAL[classId] : `${CLASS_PLURAL[classId]} de referência (guias e fontes externas)`;
  return `${verb} ${formatProportionOfTen(reason.characters, reason.sampleCharacters)} ${group}`;
}
