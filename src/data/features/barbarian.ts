import type { FeatureDefinition } from "../../domain/features.js";
import type { SkillKey } from "../../domain/ids.js";
import { classes } from "../classes.js";

/**
 * Características de CLASSE do Bárbaro, estruturadas a partir da fonte
 * "INTEGRAÇÃO COMPLETA — BÁRBARO E SUBCLASSES" — substitui as entradas
 * genéricas que existiam antes em `NAMED_FEATURES_BY_CLASS.barbaro`
 * (nome+nível pendente de conteúdo). Mesma `FeatureDefinition` por
 * característica mesmo quando ela evolui em nível posterior (Fúria no
 * 15, Golpe Brutal no 13/17) — a evolução fica no texto impresso
 * dinâmico (`rules/barbarianPrintedFeatures.ts`), nunca numa segunda
 * `FeatureDefinition`.
 *
 * Omitidas de propósito (ver `BARBARIAN_NEVER_PRINTED_FEATURE_IDS` em
 * `rules/barbarianPrintedFeatures.ts` para a razão de cada uma não
 * entrar no campo impresso — aqui elas continuam existindo como
 * `FeatureDefinition`, só não aparecem no texto compacto):
 * "Subclasse de Bárbaro" (estrutural, tratada pela etapa 3 do Builder)
 * e "Dádiva Épica" (gerada à parte, sistema de Talentos).
 */

export const CONHECIMENTO_PRIMORDIAL_CHOICE_ID = "barbaro-conhecimento-primordial-escolha";

export const barbarianClassFeatures: FeatureDefinition[] = [
  {
    id: "barbaro-defesa-sem-armadura-1",
    name: "Defesa sem Armadura",
    sourceType: "class",
    classId: "barbaro",
    level: 1,
    autoGranted: true,
    summary: "Sem armadura: CA = 10 + mod. DEX + mod. CON (já calculado por rules/armor.ts).",
  },
  {
    id: "barbaro-furia-1",
    name: "Fúria",
    sourceType: "class",
    classId: "barbaro",
    level: 1,
    autoGranted: true,
    summary:
      "Ação Bônus, sem Armadura Pesada. Resistência a Contundente/Cortante/Perfurante; +dano em Atq FOR; Vantagem em testes/Salv. FOR; sem conjurar/Concentração. Usos conforme nível (rules/classResources.ts#getRageCount); +1/Descanso Curto, todos/Descanso Longo. A partir do nível 15 (Fúria Persistente): dura até 10 min sem precisar de extensão turno a turno, só encerra com Arma Pesada ou Inconsciente, e ao rolar Iniciativa pode recuperar todos os usos (1×/Descanso Longo) — mesma característica, nunca um bloco separado.",
  },
  {
    id: "barbaro-ataque-imprudente-2",
    name: "Ataque Imprudente",
    sourceType: "class",
    classId: "barbaro",
    level: 2,
    autoGranted: true,
    summary: "No 1º ataque do turno, escolha: Vantagem em Atq FOR até seu próximo turno; ataques contra você também têm Vantagem.",
  },
  {
    id: "barbaro-sentido-de-perigo-2",
    name: "Sentido de Perigo",
    sourceType: "class",
    classId: "barbaro",
    level: 2,
    autoGranted: true,
    summary: "Vantagem em salvaguardas de Destreza, exceto enquanto Incapacitado.",
  },
  {
    id: "barbaro-conhecimento-primordial-3",
    name: "Conhecimento Primordial",
    sourceType: "class",
    classId: "barbaro",
    level: 3,
    autoGranted: false,
    summary:
      "Escolha 1 perícia adicional (entre as de Bárbaro, excluindo as que já for proficiente) — proficiência aplicada direto em Perícias/PDF, nunca repetida aqui. Em Fúria, Acrobacia/Furtividade/Intimidação/Percepção/Sobrevivência podem usar FOR.",
    choices: [
      {
        id: CONHECIMENTO_PRIMORDIAL_CHOICE_ID,
        prompt: "Conhecimento Primordial — escolha 1 perícia adicional",
        effect: {
          kind: "skillProficiency",
          options: classes.barbaro.skillChoice!.from as SkillKey[],
          count: 1,
          excludeAlreadyProficient: true,
        },
      },
    ],
  },
  {
    id: "barbaro-ataque-extra-5",
    name: "Ataque Extra",
    sourceType: "class",
    classId: "barbaro",
    level: 5,
    autoGranted: true,
    summary: "2 ataques ao usar a ação Atacar (rules/classResources.ts#getExtraAttacksCount).",
  },
  {
    id: "barbaro-bote-instintivo-7",
    name: "Bote Instintivo",
    sourceType: "class",
    classId: "barbaro",
    level: 7,
    autoGranted: true,
    summary: "Ao entrar em Fúria, mova até metade do Deslocamento como parte da mesma Ação Bônus.",
  },
  {
    id: "barbaro-instintos-primitivos-7",
    name: "Instintos Primitivos",
    sourceType: "class",
    classId: "barbaro",
    level: 7,
    autoGranted: true,
    summary: "Vantagem em jogadas de Iniciativa (o campo numérico de Iniciativa não representa Vantagem — regra fica só no texto).",
  },
  {
    id: "barbaro-golpe-brutal-9",
    name: "Golpe Brutal",
    sourceType: "class",
    classId: "barbaro",
    level: 9,
    autoGranted: true,
    summary:
      "Com Ataque Imprudente, renuncie à Vantagem de 1 ataque FOR sem Desvantagem; ao acertar, +1d10 dano (nível 9+) ou +2d10 (nível 17+) do mesmo tipo + escolha 1 efeito (nível 9+: Debilitador/Poderoso; nível 13+: também Atordoante/Destruidor; nível 17+: escolha 2 efeitos diferentes). Mesma característica em todos os níveis — nunca 'Golpe Brutal Fortalecido' separado.",
  },
  {
    id: "barbaro-furia-implacavel-11",
    name: "Fúria Implacável",
    sourceType: "class",
    classId: "barbaro",
    level: 11,
    autoGranted: true,
    summary: "Em Fúria, ao cair a 0 PV sem morrer: Salv. CON CD 10 (sucesso → PV = 2× nível de Bárbaro); CD +5 por novo uso; reseta no Descanso Curto ou Longo.",
  },
  {
    id: "barbaro-forca-indomavel-18",
    name: "Força Indomável",
    sourceType: "class",
    classId: "barbaro",
    level: 18,
    autoGranted: true,
    summary: "Se um teste ou salvaguarda de Força total ficar menor que o valor de Força, use o próprio valor de Força como resultado.",
  },
  {
    id: "barbaro-campeao-primitivo-20",
    name: "Campeão Primitivo",
    sourceType: "class",
    classId: "barbaro",
    level: 20,
    autoGranted: true,
    summary: "Força +4 e Constituição +4 (máximo 25 em cada) — já aplicado automaticamente aos atributos/modificadores/PV/CA/salvaguardas/perícias (rules/abilities.ts#getEffectiveAbilityScore).",
  },
];

/** Id estável da feature "Maestria em Arma" nº N (1–4) do Bárbaro — usado para ler a seleção em `rules/weapons.ts`/`rules/proficiencyText.ts`. */
export function getBarbarianWeaponMasteryChoiceId(slot: 1 | 2 | 3 | 4): string {
  return `barbaro-maestria-arma-${slot}-escolha`;
}

/**
 * "Maestria em Arma" do Bárbaro — 4 `FeatureDefinition` separadas (uma
 * por arma), cada uma desbloqueando no nível em que aquele slot
 * aparece na progressão (`BARBARIAN_WEAPON_MASTERIES`: 2 armas no
 * nível 1, a 3ª no nível 4, a 4ª no nível 10) — mesmo padrão já usado
 * para as 2 escolhas de arma simples do equipamento inicial do
 * Artífice. Nunca aparecem no campo "Características de Classe" (vão
 * para Proficiências/Armas, ver `rules/proficiencyText.ts`).
 */
export const barbarianWeaponMasteryFeatures: FeatureDefinition[] = ([1, 1, 4, 10] as const).map((level, index) => {
  const slot = (index + 1) as 1 | 2 | 3 | 4;
  return {
    id: `barbaro-maestria-arma-${slot}`,
    name: "Maestria em Arma",
    sourceType: "class",
    classId: "barbaro",
    level,
    autoGranted: false,
    summary: `Escolha a ${slot}ª arma corpo a corpo (Simples ou Marcial) com Maestria — vai para Proficiências/Armas, nunca para Características de Classe.`,
    choices: [
      {
        id: getBarbarianWeaponMasteryChoiceId(slot),
        prompt: `Maestria em Arma — escolha a ${slot}ª arma corpo a corpo`,
        effect: { kind: "weaponPicker", category: "any", count: 1, rangeKind: "corpoACorpo" },
      },
    ],
  } satisfies FeatureDefinition;
});
