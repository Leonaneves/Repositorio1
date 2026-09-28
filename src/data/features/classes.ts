import { CLASS_IDS } from "../../domain/ids.js";
import type { FeatureDefinition } from "../../domain/features.js";
import { classes, getClassSkillChoiceId } from "../classes.js";

/**
 * Features de CLASSE já confirmadas nesta etapa: só as duas cujos
 * números foram explicitamente confirmados por você nesta conversa
 * (ver `rules/speed.ts#getClassSpeedBonus`) — o restante da progressão
 * de features por classe/nível (D&D 2024 completo) é um volume de dados
 * grande que ainda não foi confirmado comigo, então fica
 * deliberadamente de fora aqui em vez de ser inventado (ver relatório
 * de pendências). `getClassFeatures` (rules/features.ts) já está pronta
 * para receber o restante sem precisar mudar de formato.
 */
const mechanicalClassFeatures: FeatureDefinition[] = [
  {
    id: "barbaro-movimento-rapido",
    name: "Movimento Rápido",
    sourceType: "class",
    classId: "barbaro",
    level: 5,
    autoGranted: true,
    summary: "+3m de deslocamento enquanto estiver sem armadura (o bônus já entra na Ficha Web via rules/speed.ts).",
  },
  {
    id: "monge-movimento-sem-armadura",
    name: "Movimento sem Armadura",
    sourceType: "class",
    classId: "monge",
    level: 2,
    autoGranted: true,
    summary:
      "Bônus de deslocamento sem armadura nem escudo, crescente por nível (+3m no 2º, +4,5m no 6º, +6m no 10º, +7,5m no 14º, +9m no 18º — já calculado por rules/speed.ts).",
  },
];

/**
 * Uma feature "Perícias de Classe" por classe com `skillChoice`
 * confirmado (base consolidada de classes) — sempre no nível 1,
 * sempre com uma única `FeatureChoice` do tipo `skillProficiency`. A
 * seleção do jogador (`character.featureChoiceSelections[choiceId]`)
 * é lida por `rules/skills.ts#isSkillGrantedByClassChoice`, que usa o
 * mesmo id (`getClassSkillChoiceId`) — nunca duplicamos a escolha em
 * dois lugares.
 */
const classSkillChoiceFeatures: FeatureDefinition[] = CLASS_IDS.filter((classId) => classes[classId].skillChoice !== undefined).map(
  (classId) => {
    const skillChoice = classes[classId].skillChoice!;
    return {
      id: `${classId}-pericias-de-classe`,
      name: "Perícias de Classe",
      sourceType: "class",
      classId,
      level: 1,
      autoGranted: false,
      summary: `Escolha ${skillChoice.count} ${skillChoice.count === 1 ? "perícia" : "perícias"}${
        skillChoice.from === "any" ? " quaisquer" : ""
      }.`,
      choices: [
        {
          id: getClassSkillChoiceId(classId),
          prompt: `Escolha ${skillChoice.count} ${skillChoice.count === 1 ? "perícia" : "perícias"} de ${classes[classId].name}`,
          effect: { kind: "skillProficiency", options: skillChoice.from, count: skillChoice.count },
        },
      ],
    } satisfies FeatureDefinition;
  },
);

export const classFeatures: FeatureDefinition[] = [...mechanicalClassFeatures, ...classSkillChoiceFeatures];
