import type { FeatureDefinition } from "../../domain/features.js";

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
export const classFeatures: FeatureDefinition[] = [
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
