/**
 * Identificadores de catálogo (classes, espécies, antecedentes, armaduras,
 * perícias). Os valores em português, sem acento, em camelCase, são a
 * "chave" estável usada nos dados estáticos e no motor de regras; os
 * nomes de exibição (com acento, formatados) ficam nos objetos de
 * `data/*`, nunca aqui.
 */

export const CLASS_IDS = [
  "artifice",
  "barbaro",
  "bardo",
  "bruxo",
  "clerigo",
  "druida",
  "feiticeiro",
  "guerreiro",
  "ladino",
  "mago",
  "monge",
  "paladino",
  "patrulheiro",
] as const;
export type ClassId = (typeof CLASS_IDS)[number];

export const SPECIES_IDS = [
  "aasimar",
  "anao",
  "draconato",
  "elfo",
  "gnomo",
  "golias",
  "halfling",
  "humano",
  "orc",
  "tiefling",
] as const;
export type SpeciesId = (typeof SPECIES_IDS)[number];

export const BACKGROUND_IDS = [
  "acolito",
  "andarilho",
  "artesao",
  "artista",
  "charlatao",
  "criminoso",
  "eremita",
  "escriba",
  "fazendeiro",
  "guarda",
  "guia",
  "marinheiro",
  "mercador",
  "nobre",
  "sabio",
  "soldado",
] as const;
export type BackgroundId = (typeof BACKGROUND_IDS)[number];

export const ARMOR_IDS = [
  "acolchoada",
  "couro",
  "couroBatido",
  "gibaoDePeles",
  "camisaDeMalha",
  "brunea",
  "peitoral",
  "meiaArmadura",
  "cotaDeAneis",
  "cotaDeMalha",
  "cotaDeTalas",
  "placas",
] as const;
export type ArmorId = (typeof ARMOR_IDS)[number];

export const SKILL_KEYS = [
  "atletismo",
  "acrobacia",
  "furtividade",
  "prestidigitacao",
  "arcanismo",
  "historia",
  "investigacao",
  "natureza",
  "religiao",
  "intuicao",
  "lidarComAnimais",
  "medicina",
  "percepcao",
  "sobrevivencia",
  "atuacao",
  "enganacao",
  "intimidacao",
  "persuasao",
] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

/**
 * Tamanhos usados pelas 10 espécies do escopo (Pequeno: Gnomo e
 * Halfling; Médio: as demais). O tipo fica aberto para os outros
 * tamanhos do 5e (Miúdo/Grande/Enorme/Imenso) para não travar extensões
 * futuras, mas os dados estáticos atuais só usam estes dois.
 */
export const SIZE_OPTIONS = ["Miúdo", "Pequeno", "Médio", "Grande", "Enorme", "Imenso"] as const;
export type SizeId = (typeof SIZE_OPTIONS)[number];

export const SPELL_CIRCLES = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export type SpellCircle = (typeof SPELL_CIRCLES)[number];

/** Tipo de progressão de conjurador, usado pela tabela de espaços de magia. */
/** "artificer" = progressão própria do Artífice (tabela explícita própria — nunca a fórmula genérica de meio-conjurador). */
export type CasterProgressionType = "full" | "half" | "third" | "pact" | "artificer" | "none";
