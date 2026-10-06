import type { AbilityKey } from "../domain/common.js";
import { BACKGROUND_IDS, type BackgroundId, type SkillKey } from "../domain/ids.js";
import type { AbilityAllocationConfig } from "../rules/abilityAllocation.js";

/**
 * Regra universal de "Aumentos de Atributo" do Antecedente no D&D 2024
 * PHB: 3 pontos totais, máximo +2 numa mesma habilidade (permite tanto
 * +2/+1 quanto +1/+1/+1) — igual para os 16 antecedentes, só as 3
 * habilidades elegíveis variam por antecedente (fonte "REORGANIZAÇÃO DO
 * BUILDER" §19/§20, confirmada via busca às tabelas oficiais do PHB
 * 2024 — nunca inventada).
 */
export const BACKGROUND_ABILITY_TOTAL_POINTS = 3;
export const BACKGROUND_ABILITY_MAX_PER_ABILITY = 2;

export interface BackgroundDefinition {
  id: BackgroundId;
  name: string;
  /** Exatamente 2 perícias, extraídas do script `ANTECEDENTE` do PDF original. */
  grantedSkills: [SkillKey, SkillKey];
  /** Texto do talento de origem, extraído literalmente do PDF. */
  originFeat: string;
  /** As 3 habilidades elegíveis para distribuir os Aumentos de Atributo deste Antecedente (PHB 2024). */
  abilityScoreOptions: [AbilityKey, AbilityKey, AbilityKey];
  /**
   * Alguns antecedentes concedem conjuração via talento "Iniciado em
   * Magia" (Acólito→Clérigo, Guia→Druida, Sábio→Mago). Por decisão do
   * projeto (ver §7 da arquitetura), isso só se torna o atributo de
   * conjuração do personagem quando a CLASSE escolhida não tiver um
   * atributo de conjuração próprio (ex.: Guerreiro, Monge, Bárbaro) —
   * nunca sobrepõe o atributo de uma classe conjuradora, e não concede
   * espaços de magia (só o suporte para CD/ataque mágico do truque e da
   * magia do talento).
   */
  grantsSpellcastingAbility?: AbilityKey;
}

export const backgrounds: Record<BackgroundId, BackgroundDefinition> = {
  acolito: {
    id: "acolito",
    name: "Acólito",
    grantedSkills: ["intuicao", "religiao"],
    originFeat: "Iniciado em Magia (Clérigo): 2 truques e 1 magia de 1º nível",
    abilityScoreOptions: ["INT", "SAB", "CAR"],
    grantsSpellcastingAbility: "SAB",
  },
  andarilho: {
    id: "andarilho",
    name: "Andarilho",
    grantedSkills: ["furtividade", "intuicao"],
    originFeat: "Sortudo: vantagem ou desvantagem = proficiência",
    abilityScoreOptions: ["DEX", "SAB", "CAR"],
  },
  artesao: {
    id: "artesao",
    name: "Artesão",
    grantedSkills: ["investigacao", "persuasao"],
    originFeat: "Artifista",
    abilityScoreOptions: ["FOR", "DEX", "INT"],
  },
  artista: {
    id: "artista",
    name: "Artista",
    grantedSkills: ["acrobacia", "atuacao"],
    originFeat: "Músico",
    abilityScoreOptions: ["FOR", "DEX", "CAR"],
  },
  charlatao: {
    id: "charlatao",
    name: "Charlatão",
    grantedSkills: ["enganacao", "prestidigitacao"],
    originFeat: "Habilidoso: 2 Perícias",
    abilityScoreOptions: ["DEX", "CON", "CAR"],
  },
  criminoso: {
    id: "criminoso",
    name: "Criminoso",
    grantedSkills: ["prestidigitacao", "furtividade"],
    originFeat: "Alerta: +prof em Iniciativa e pode trocar sua vez com um amigo",
    abilityScoreOptions: ["DEX", "CON", "INT"],
  },
  eremita: {
    id: "eremita",
    name: "Eremita",
    grantedSkills: ["medicina", "religiao"],
    originFeat:
      "Curandeiro: Rerrola os 1 em dados de cura | Pode usar o Kit de Cura para curar alguém em 1 dado de vida da pessoa + sua proficiência",
    abilityScoreOptions: ["CON", "SAB", "CAR"],
  },
  escriba: {
    id: "escriba",
    name: "Escriba",
    grantedSkills: ["investigacao", "percepcao"],
    originFeat: "Habilidoso: 2 Perícias",
    abilityScoreOptions: ["DEX", "INT", "SAB"],
  },
  fazendeiro: {
    id: "fazendeiro",
    name: "Fazendeiro",
    grantedSkills: ["lidarComAnimais", "natureza"],
    originFeat: "Vigoroso: +2HP por nível",
    abilityScoreOptions: ["FOR", "CON", "SAB"],
  },
  guarda: {
    id: "guarda",
    name: "Guarda",
    grantedSkills: ["atletismo", "percepcao"],
    originFeat: "Alerta: +prof em Iniciativa e pode trocar sua vez com um amigo",
    abilityScoreOptions: ["FOR", "INT", "SAB"],
  },
  guia: {
    id: "guia",
    name: "Guia",
    grantedSkills: ["furtividade", "sobrevivencia"],
    originFeat: "Iniciado em Magia (Druida): 2 truques e 1 magia de 1º nível",
    abilityScoreOptions: ["DEX", "CON", "SAB"],
    grantsSpellcastingAbility: "SAB",
  },
  marinheiro: {
    id: "marinheiro",
    name: "Marinheiro",
    grantedSkills: ["acrobacia", "percepcao"],
    originFeat: "Valentão de Taverna",
    abilityScoreOptions: ["FOR", "DEX", "SAB"],
  },
  mercador: {
    id: "mercador",
    name: "Mercador",
    grantedSkills: ["lidarComAnimais", "persuasao"],
    originFeat: "Sortudo: vantagem ou desvantagem = proficiência",
    abilityScoreOptions: ["CON", "INT", "CAR"],
  },
  nobre: {
    id: "nobre",
    name: "Nobre",
    grantedSkills: ["historia", "persuasao"],
    originFeat: "Habilidoso: 2 Perícias",
    abilityScoreOptions: ["FOR", "INT", "CAR"],
  },
  sabio: {
    id: "sabio",
    name: "Sábio",
    grantedSkills: ["arcanismo", "historia"],
    originFeat: "Iniciado em Magia (Mago): 2 truques e 1 magia de 1º nível",
    abilityScoreOptions: ["CON", "INT", "SAB"],
    grantsSpellcastingAbility: "INT",
  },
  soldado: {
    id: "soldado",
    name: "Soldado",
    grantedSkills: ["atletismo", "intimidacao"],
    originFeat: "Atacante Selvagem: Rerola 1 dado de dano p/ turno",
    abilityScoreOptions: ["FOR", "DEX", "CON"],
  },
};

export const backgroundList: BackgroundDefinition[] = BACKGROUND_IDS.map((id) => backgrounds[id]);

/** Configuração de distribuição (`rules/abilityAllocation.ts`) para os Aumentos de Atributo do Antecedente informado. */
export function getBackgroundAbilityAllocationConfig(backgroundId: BackgroundId): AbilityAllocationConfig {
  return {
    eligibleAbilities: [...backgrounds[backgroundId].abilityScoreOptions],
    totalPoints: BACKGROUND_ABILITY_TOTAL_POINTS,
    maxPerAbility: BACKGROUND_ABILITY_MAX_PER_ABILITY,
  };
}
