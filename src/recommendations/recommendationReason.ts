import type { ClassId, SpeciesId } from "../domain/ids.js";

/**
 * Motivo de UMA opção recomendada. Dois modos (pedido do usuário: "a
 * mensagem pode ser diferente dependendo do que está sendo recomendado"):
 *
 * - `proportion` — recomendação de UM fator só: Subclasse (só a classe),
 *   "escolhido por X de 10 {classe}"; Linhagem (só a espécie),
 *   "escolhido por X de 10 {espécie}";
 * - `blend` — recomendação influenciada por vários fatores (classe,
 *   subclasse, atributos, escolhas já feitas): só "★ Recomendado", com
 *   uma linha abaixo do seletor dizendo quais fatores foram usados.
 *
 * `source` separa jogadores reais de personagens de referência — uma
 * referência nunca é descrita como escolha de jogadores.
 */
export type RecommendationReason =
  | {
      mode: "proportion";
      characters: number;
      sampleCharacters: number;
      source: "user" | "reference";
      /** Quem foi comparado, no plural — "feiticeiros", "elfos". */
      group: string;
    }
  | { mode: "blend"; source: "user" | "reference" };

/** Opções recomendadas de UM seletor (na ordem do ranking) + os fatores usados (modo `blend`). */
export class Recommendations {
  constructor(
    readonly reasons: ReadonlyMap<string, RecommendationReason> = new Map(),
    /** Ex.: ["sua classe", "sua subclasse"] — exibido como "★ Recomendações com base em sua classe e sua subclasse." */
    readonly basis: readonly string[] = [],
  ) {}

  has(value: string): boolean {
    return this.reasons.has(value);
  }

  get(value: string): RecommendationReason | undefined {
    return this.reasons.get(value);
  }

  get size(): number {
    return this.reasons.size;
  }
}

export const NO_RECOMMENDATIONS = new Recommendations();

export const CLASS_PLURAL: Record<ClassId, string> = {
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

export const SPECIES_PLURAL: Record<SpeciesId, string> = {
  aasimar: "aasimares",
  anao: "anões",
  draconato: "draconatos",
  elfo: "elfos",
  gnomo: "gnomos",
  golias: "golias",
  halfling: "halflings",
  humano: "humanos",
  orc: "orcs",
  tiefling: "tieflings",
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

/** Ex.: "escolhido por 7 de 10 guerreiros", "escolhido por 3 de cada 10 elfos" (modo `proportion`). */
export function formatProportionReason(characters: number, sampleCharacters: number, source: "user" | "reference", group: string): string {
  const who = source === "user" ? group : `${group} de referência (guias e fontes externas)`;
  return `escolhido por ${formatProportionOfTen(characters, sampleCharacters)} ${who}`;
}

/** "a", "a e b", "a, b e c". */
export function joinWithE(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}

/** Linha do modo `blend`: "★ Recomendações com base em sua classe e sua subclasse." */
export function formatBlendBasis(basis: readonly string[], source: "user" | "reference"): string {
  const who = source === "user" ? "" : " de personagens de referência (guias e fontes externas)";
  return basis.length > 0 ? `★ Recomendações${who} com base em ${joinWithE(basis)}.` : `★ Recomendações${who}.`;
}

/** Texto exibido no `<option>`/rótulo — o motivo fica abaixo do seletor (`RecommendationReasonsHint`). */
export function withRecommendedLabel(name: string, reason: RecommendationReason | boolean | undefined): string {
  if (!reason) return name;
  if (reason === true || reason.mode === "proportion") return `${name} (Recomendado)`;
  return `${name} (★ Recomendado)`;
}
