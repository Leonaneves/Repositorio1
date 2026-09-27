import type { AbilityKey } from "../domain/common.js";
import { BACKGROUND_IDS, type BackgroundId, type SkillKey } from "../domain/ids.js";

export interface BackgroundDefinition {
  id: BackgroundId;
  name: string;
  /** Exatamente 2 perícias, extraídas do script `ANTECEDENTE` do PDF original. */
  grantedSkills: [SkillKey, SkillKey];
  /** Texto do talento de origem, extraído literalmente do PDF. */
  originFeat: string;
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
    grantsSpellcastingAbility: "SAB",
  },
  andarilho: {
    id: "andarilho",
    name: "Andarilho",
    grantedSkills: ["furtividade", "intuicao"],
    originFeat: "Sortudo: vantagem ou desvantagem = proficiência",
  },
  artesao: {
    id: "artesao",
    name: "Artesão",
    grantedSkills: ["investigacao", "persuasao"],
    originFeat: "Artifista",
  },
  artista: {
    id: "artista",
    name: "Artista",
    grantedSkills: ["acrobacia", "atuacao"],
    originFeat: "Músico",
  },
  charlatao: {
    id: "charlatao",
    name: "Charlatão",
    grantedSkills: ["enganacao", "prestidigitacao"],
    originFeat: "Habilidoso: 2 Perícias",
  },
  criminoso: {
    id: "criminoso",
    name: "Criminoso",
    grantedSkills: ["prestidigitacao", "furtividade"],
    originFeat: "Alerta: +prof em Iniciativa e pode trocar sua vez com um amigo",
  },
  eremita: {
    id: "eremita",
    name: "Eremita",
    grantedSkills: ["medicina", "religiao"],
    originFeat:
      "Curandeiro: Rerrola os 1 em dados de cura | Pode usar o Kit de Cura para curar alguém em 1 dado de vida da pessoa + sua proficiência",
  },
  escriba: {
    id: "escriba",
    name: "Escriba",
    grantedSkills: ["investigacao", "percepcao"],
    originFeat: "Habilidoso: 2 Perícias",
  },
  fazendeiro: {
    id: "fazendeiro",
    name: "Fazendeiro",
    grantedSkills: ["lidarComAnimais", "natureza"],
    originFeat: "Vigoroso: +2HP por nível",
  },
  guarda: {
    id: "guarda",
    name: "Guarda",
    grantedSkills: ["atletismo", "percepcao"],
    originFeat: "Alerta: +prof em Iniciativa e pode trocar sua vez com um amigo",
  },
  guia: {
    id: "guia",
    name: "Guia",
    grantedSkills: ["furtividade", "sobrevivencia"],
    originFeat: "Iniciado em Magia (Druida): 2 truques e 1 magia de 1º nível",
    grantsSpellcastingAbility: "SAB",
  },
  marinheiro: {
    id: "marinheiro",
    name: "Marinheiro",
    grantedSkills: ["acrobacia", "percepcao"],
    originFeat: "Valentão de Taverna",
  },
  mercador: {
    id: "mercador",
    name: "Mercador",
    grantedSkills: ["lidarComAnimais", "persuasao"],
    originFeat: "Sortudo: vantagem ou desvantagem = proficiência",
  },
  nobre: {
    id: "nobre",
    name: "Nobre",
    grantedSkills: ["historia", "persuasao"],
    originFeat: "Habilidoso: 2 Perícias",
  },
  sabio: {
    id: "sabio",
    name: "Sábio",
    grantedSkills: ["arcanismo", "historia"],
    originFeat: "Iniciado em Magia (Mago): 2 truques e 1 magia de 1º nível",
    grantsSpellcastingAbility: "INT",
  },
  soldado: {
    id: "soldado",
    name: "Soldado",
    grantedSkills: ["atletismo", "intimidacao"],
    originFeat: "Atacante Selvagem: Rerola 1 dado de dano p/ turno",
  },
};

export const backgroundList: BackgroundDefinition[] = BACKGROUND_IDS.map((id) => backgrounds[id]);
