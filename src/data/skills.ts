import type { AbilityKey } from "../domain/common.js";
import { SKILL_KEYS, type SkillKey } from "../domain/ids.js";

export interface SkillDefinition {
  id: SkillKey;
  name: string;
  ability: AbilityKey;
}

/**
 * As 18 perícias do 5e/2024, com o atributo que as governa, extraídas
 * dos nomes de campo do PDF original (ex.: `DEX.acr` = Acrobacia,
 * `SAB.perc` = Percepção). Fonte de verdade: `docs/referencia/campos-completos.json`.
 */
export const skills: Record<SkillKey, SkillDefinition> = {
  atletismo: { id: "atletismo", name: "Atletismo", ability: "FOR" },
  acrobacia: { id: "acrobacia", name: "Acrobacia", ability: "DEX" },
  furtividade: { id: "furtividade", name: "Furtividade", ability: "DEX" },
  prestidigitacao: { id: "prestidigitacao", name: "Prestidigitação", ability: "DEX" },
  arcanismo: { id: "arcanismo", name: "Arcanismo", ability: "INT" },
  historia: { id: "historia", name: "História", ability: "INT" },
  investigacao: { id: "investigacao", name: "Investigação", ability: "INT" },
  natureza: { id: "natureza", name: "Natureza", ability: "INT" },
  religiao: { id: "religiao", name: "Religião", ability: "INT" },
  intuicao: { id: "intuicao", name: "Intuição", ability: "SAB" },
  lidarComAnimais: { id: "lidarComAnimais", name: "Lidar com Animais", ability: "SAB" },
  medicina: { id: "medicina", name: "Medicina", ability: "SAB" },
  percepcao: { id: "percepcao", name: "Percepção", ability: "SAB" },
  sobrevivencia: { id: "sobrevivencia", name: "Sobrevivência", ability: "SAB" },
  atuacao: { id: "atuacao", name: "Atuação", ability: "CAR" },
  enganacao: { id: "enganacao", name: "Enganação", ability: "CAR" },
  intimidacao: { id: "intimidacao", name: "Intimidação", ability: "CAR" },
  persuasao: { id: "persuasao", name: "Persuasão", ability: "CAR" },
};

export const skillList: SkillDefinition[] = SKILL_KEYS.map((key) => skills[key]);
