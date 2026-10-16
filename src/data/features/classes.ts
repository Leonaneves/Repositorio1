import { CLASS_IDS, type ClassId } from "../../domain/ids.js";
import type { FeatureDefinition } from "../../domain/features.js";
import { classes, getClassSkillChoiceId, getClassToolChoiceId } from "../classes.js";
import { barbarianClassFeatures, barbarianWeaponMasteryFeatures } from "./barbarian.js";
import { bardClassFeatures } from "./bard.js";
import { clericClassFeatures } from "./cleric.js";
import { druidClassFeatures } from "./druid.js";
import { fighterClassFeatures } from "./fighter.js";
import { monkClassFeatures } from "./monk.js";
import { paladinClassFeatures } from "./paladin.js";
import { rangerClassFeatures } from "./ranger.js";
import { rogueClassFeatures } from "./rogue.js";
import { sorcererClassFeatures } from "./sorcerer.js";
import { warlockClassFeatures } from "./warlock.js";
import { wizardClassFeatures } from "./wizard.js";

/**
 * Features de CLASSE cujo efeito mecânico já está implementado em
 * `rules/` — cada uma explica, no `summary`, ONDE o cálculo mora (nunca
 * duplicamos o número aqui, só apontamos para a função).
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
          // `excludeAlreadyProficient` (fonte "REORGANIZAÇÃO DO BUILDER" §9): uma perícia já concedida
          // pelo Antecedente some das opções desta escolha — nunca consome 1 das N escolhas de Classe.
          effect: { kind: "skillProficiency", options: skillChoice.from, count: skillChoice.count, excludeAlreadyProficient: true },
        },
      ],
    } satisfies FeatureDefinition;
  },
);

const TOOL_CATEGORY_LABELS: Record<string, string> = {
  artisanTool: "Ferramenta de Artesão",
  musicalInstrument: "Instrumento Musical",
  thievesTools: "Ferramentas de Ladrão",
};

function toolCategoryLabel(category: string | string[]): string {
  const categories = Array.isArray(category) ? category : [category];
  return categories.map((c) => TOOL_CATEGORY_LABELS[c] ?? c).join(" ou ");
}

/**
 * Uma feature "Ferramentas de Classe" por classe com `toolChoice`
 * confirmado (Artífice: 1 Ferramenta de Artesão; Bardo: 3 Instrumentos
 * Musicais; Monge: 1 Ferramenta de Artesão OU Instrumento Musical) —
 * sempre nível 1, sempre com uma `FeatureChoice` do tipo
 * `toolProficiency`, escolha ESTRUTURADA a partir do catálogo
 * (`data/tools.ts`/`rules/tools.ts#getEligibleTools`) — nunca mais
 * texto livre (fonte "REORGANIZAÇÃO DO BUILDER" §4/§5). Classes com
 * concessão automática fixa (ex.: Druida → Kit de Herbalismo, Ladino →
 * Ferramentas de Ladrão) não entram aqui — não há escolha nenhuma a
 * registrar, só `toolProficiencyText`.
 */
const classToolChoiceFeatures: FeatureDefinition[] = CLASS_IDS.filter((classId) => classes[classId].toolChoice !== undefined).map(
  (classId) => {
    const toolChoice = classes[classId].toolChoice!;
    const categoryLabel = toolCategoryLabel(toolChoice.category);
    return {
      id: `${classId}-ferramentas-de-classe`,
      name: "Ferramentas de Classe",
      sourceType: "class",
      classId,
      level: 1,
      autoGranted: false,
      summary: `Escolha ${toolChoice.count} ${toolChoice.count === 1 ? "ferramenta" : "ferramentas"}: ${categoryLabel}.`,
      choices: [
        {
          id: getClassToolChoiceId(classId),
          prompt: `Escolha ${toolChoice.count} ${toolChoice.count === 1 ? "ferramenta" : "ferramentas"} de ${classes[classId].name} (${categoryLabel})`,
          effect: { kind: "toolProficiency", category: toolChoice.category, count: toolChoice.count },
        },
      ],
    } satisfies FeatureDefinition;
  },
);

interface NamedFeature {
  name: string;
  level: number;
}

/**
 * Nomes e níveis de aquisição transcritos literalmente da coluna
 * "Características"/"Características de Classe" da base consolidada
 * de classes — NUNCA o conteúdo mecânico/explicativo (isso fica
 * `pending`, ver `toFeatureDefinitions`). Omite de propósito: linhas
 * "Subclasse de X" e "Característica de Subclasse" (estrutural —
 * tratado pela etapa 3 do Builder + `rules/subclasses.ts` +
 * `data/subclassFeatureLevels.ts`), "Aumento no Valor de Atributo" e
 * "Dádiva Épica" (geradas à parte, com uma `FeatureChoice` de
 * fallback), e as duas já cobertas por `mechanicalClassFeatures`
 * (Movimento Rápido do Bárbaro nível 5, Movimento sem Armadura do
 * Monge nível 2).
 */
const NAMED_FEATURES_BY_CLASS: Partial<Record<ClassId, NamedFeature[]>> = {
  artifice: [
    { name: "Ajustes Mágicos", level: 1 },
    { name: "Conjuração", level: 1 },
    { name: "Infundir Item", level: 2 },
    { name: "A Ferramenta Certa para o Trabalho", level: 3 },
    { name: "Especialização em Ferramentas", level: 6 },
    { name: "Lampejo de Gênio", level: 7 },
    { name: "Adepto de Itens Mágicos", level: 10 },
    { name: "Item de Armazenar Magia", level: 11 },
    { name: "Sábio dos Itens Mágicos", level: 14 },
    { name: "Mestre dos Itens Mágicos", level: 18 },
    { name: "Alma do Artífice", level: 20 },
  ],
  // Bárbaro removido daqui — fonte "INTEGRAÇÃO COMPLETA — BÁRBARO E SUBCLASSES" tem
  // conteúdo mecânico completo, não só nome+nível pendente (ver data/features/barbarian.ts).
  // Bardo removido daqui — fonte "INTEGRAÇÃO COMPLETA — BARDO E SUBCLASSES" tem
  // conteúdo mecânico completo, não só nome+nível pendente (ver data/features/bard.ts).
  // Bruxo removido daqui — fonte "INTEGRAÇÃO COMPLETA — BRUXO, INVOCAÇÕES MÍSTICAS E
  // SUBCLASSES" tem conteúdo mecânico completo, não só nome+nível pendente (ver data/features/warlock.ts).
  // Clérigo removido daqui — fonte "INTEGRAÇÃO COMPLETA — CLÉRIGO E SUBCLASSES" tem
  // conteúdo mecânico completo, não só nome+nível pendente (ver data/features/cleric.ts).
  // Druida removido daqui — fonte "INTEGRAÇÃO COMPLETA — DRUIDA E SUBCLASSES" tem
  // conteúdo mecânico completo, não só nome+nível pendente (ver data/features/druid.ts).
  // Feiticeiro removido daqui — fonte "INTEGRAÇÃO COMPLETA — FEITICEIRO, METAMAGIA E
  // SUBCLASSES" tem conteúdo mecânico completo, não só nome+nível pendente (ver data/features/sorcerer.ts).
  // Patrulheiro removido daqui — fonte "COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO
  // PDF" tem conteúdo mecânico completo, não só nome+nível pendente (ver data/features/ranger.ts).
  // Guerreiro removido daqui — fonte "COMPLETAR A CLASSE GUERREIRO NO BUILDER E NO PDF" tem
  // conteúdo mecânico completo, não só nome+nível pendente (ver data/features/fighter.ts).
  // Ladino removido daqui — fonte "IMPLEMENTAR LADINO E SUAS SUBCLASSES NO BUILDER E NO PDF" tem
  // conteúdo mecânico completo, não só nome+nível pendente (ver data/features/rogue.ts).
  // Mago removido daqui — fonte "IMPLEMENTAR MAGO E SUAS SUBCLASSES NO BUILDER E NO PDF" tem
  // conteúdo mecânico completo, não só nome+nível pendente (ver data/features/wizard.ts).
  // Monge removido daqui — fonte "IMPLEMENTAR MONGE E SUAS SUBCLASSES NO BUILDER E NO PDF" tem
  // conteúdo mecânico completo, não só nome+nível pendente (ver data/features/monk.ts).
  // Paladino removido daqui — fonte "IMPLEMENTAR PALADINO E SUAS SUBCLASSES NO BUILDER E NO PDF"
  // tem conteúdo mecânico completo, não só nome+nível pendente (ver data/features/paladin.ts).
};

/**
 * Níveis de Aumento no Valor de Atributo confirmados por classe —
 * Guerreiro e Ladino recebem mais do que as demais. Artífice é a
 * única com ASI também no nível 19 (a própria tabela da fonte dá "Aumento
 * no Valor de Atributo" nesse nível, no lugar da Dádiva Épica — ver
 * `DADIVA_EPICA_CLASSES`, que exclui o Artífice por isso).
 */
export const ASI_LEVELS_BY_CLASS: Partial<Record<ClassId, number[]>> = {
  artifice: [4, 8, 12, 16, 19],
  bardo: [4, 8, 12, 16],
  barbaro: [4, 8, 12, 16],
  bruxo: [4, 8, 12, 16],
  clerigo: [4, 8, 12, 16],
  druida: [4, 8, 12, 16],
  feiticeiro: [4, 8, 12, 16],
  guerreiro: [4, 6, 8, 12, 14, 16],
  ladino: [4, 8, 10, 12, 16],
  mago: [4, 8, 12, 16],
  monge: [4, 8, 12, 16],
  paladino: [4, 8, 12, 16],
  patrulheiro: [4, 8, 12, 16],
};

/**
 * As 12 classes da base consolidada original recebem a Dádiva Épica no
 * nível 19. Artífice fica de fora: a fonte própria do Artífice dá
 * "Aumento no Valor de Atributo" no nível 19 (ver `ASI_LEVELS_BY_CLASS`)
 * e "Alma do Artífice" no nível 20 como capstone — nunca Dádiva Épica.
 * Bárbaro/Bardo/Bruxo/Clérigo/Druida/Feiticeiro/Guerreiro/Ladino/Mago/
 * Patrulheiro continuam incluídos (`ASI_LEVELS_BY_CLASS` já cobre cada
 * um com seus próprios níveis) mesmo tendo saído de
 * `NAMED_FEATURES_BY_CLASS` — por isso são somados explicitamente
 * aqui, não lidos mais dali.
 */
const DADIVA_EPICA_CLASSES: ClassId[] = [
  ...(Object.keys(NAMED_FEATURES_BY_CLASS) as ClassId[]).filter((classId) => classId !== "artifice"),
  "barbaro",
  "bardo",
  "bruxo",
  "clerigo",
  "guerreiro",
  "patrulheiro",
  "druida",
  "feiticeiro",
  "ladino",
  "mago",
  "monge",
  "paladino",
];

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toFeatureDefinitions(classId: ClassId, list: NamedFeature[]): FeatureDefinition[] {
  return list.map(({ name, level }) => ({
    id: `${classId}-${slugify(name)}-${level}`,
    name,
    sourceType: "class",
    classId,
    level,
    autoGranted: true,
    // Conteúdo mecânico/explicativo detalhado ainda não foi fornecido — nome e nível são reais, o resumo fica pendente (nunca inventado).
    summary: "Conteúdo explicativo pendente — nome e nível confirmados, aguardando a descrição da regra.",
  }));
}

const namedClassFeatures: FeatureDefinition[] = (Object.entries(NAMED_FEATURES_BY_CLASS) as [ClassId, NamedFeature[]][]).flatMap(
  ([classId, list]) => toFeatureDefinitions(classId, list),
);

/**
 * "Aumento no Valor de Atributo" (fonte "REORGANIZAÇÃO DO BUILDER"
 * §22-§29): `choices` fica vazio de propósito — a escolha agora tem UI
 * PRÓPRIA (`ui/builder/AsiControl.tsx` + `rules/asi.ts`, com o mesmo
 * componente genérico de distribuição usado pelo Antecedente), fora do
 * `FeatureChoiceControl` genérico, para nunca registrar 2x (mesma razão
 * de Metamagia/Invocações/Terreno/Afinidade). Esta `FeatureDefinition`
 * continua existindo só para nome/nível aparecerem corretamente onde
 * fizer sentido (nunca no PDF — já excluído nos composers de texto).
 */
const abilityScoreImprovementFeatures: FeatureDefinition[] = (Object.entries(ASI_LEVELS_BY_CLASS) as [ClassId, number[]][]).flatMap(
  ([classId, levels]) =>
    levels.map(
      (level): FeatureDefinition => ({
        id: `${classId}-asi-${level}`,
        name: "Aumento no Valor de Atributo",
        sourceType: "class",
        classId,
        level,
        autoGranted: false,
        summary: "+2 em um atributo, +1 em dois atributos, ou um talento geral (catálogo de talentos ainda pendente).",
      }),
    ),
);

/**
 * "Dádiva Épica" (decisão §10): mesmo tratamento — feature estruturada,
 * `pending` até o catálogo de Dádivas Épicas existir.
 */
const epicBoonFeatures: FeatureDefinition[] = DADIVA_EPICA_CLASSES.map(
  (classId): FeatureDefinition => ({
    id: `${classId}-dadiva-epica`,
    name: "Dádiva Épica",
    sourceType: "class",
    classId,
    level: 19,
    autoGranted: false,
    summary: "Talento de Dádiva Épica — catálogo ainda pendente.",
    choices: [
      {
        id: `${classId}-dadiva-epica-escolha`,
        prompt: "Dádiva Épica",
        effect: { kind: "manualText", placeholder: "Dádiva Épica (catálogo pendente)" },
      },
    ],
  }),
);

/**
 * Decisões internas do equipamento inicial do Artífice — a única das
 * 13 classes cuja fonte pede isso explicitamente ("2 Armas Simples" +
 * "1 opção de armadura" são "decisões internas dentro do próprio
 * pacote" que "devem ser apresentadas no Builder"). As outras 12
 * classes mantêm esse tipo de escolha como texto livre dentro do
 * próprio `StartingEquipmentOption` (ex.: Bardo: "Instrumento Musical
 * à sua escolha") — aqui viram `FeatureDefinition`/`FeatureChoice` de
 * nível 1 de propósito, para reaproveitar 100% do mecanismo já
 * existente (mesma etapa "Características e Talentos", mesmo gating
 * de `canAdvance()`) em vez de criar um pipeline específico de
 * equipamento.
 */
const artificeEquipmentChoiceFeatures: FeatureDefinition[] = [
  {
    id: "artifice-equipamento-arma-simples-1",
    name: "Equipamento Inicial — 1ª Arma Simples",
    sourceType: "class",
    classId: "artifice",
    level: 1,
    autoGranted: false,
    summary: "Escolha 1 das 2 Armas Simples do equipamento inicial.",
    choices: [
      {
        id: "artifice-equipamento-arma-simples-1-escolha",
        prompt: "Escolha a 1ª Arma Simples do equipamento inicial",
        effect: { kind: "weaponPicker", category: "simples", count: 1 },
      },
    ],
  },
  {
    id: "artifice-equipamento-arma-simples-2",
    name: "Equipamento Inicial — 2ª Arma Simples",
    sourceType: "class",
    classId: "artifice",
    level: 1,
    autoGranted: false,
    summary: "Escolha a 2ª das 2 Armas Simples do equipamento inicial.",
    choices: [
      {
        id: "artifice-equipamento-arma-simples-2-escolha",
        prompt: "Escolha a 2ª Arma Simples do equipamento inicial",
        effect: { kind: "weaponPicker", category: "simples", count: 1 },
      },
    ],
  },
  {
    id: "artifice-equipamento-armadura",
    name: "Equipamento Inicial — Armadura",
    sourceType: "class",
    classId: "artifice",
    level: 1,
    autoGranted: false,
    summary: "Escolha entre Armadura de Couro Batido ou Cota de Escamas.",
    choices: [
      {
        id: "artifice-equipamento-armadura-escolha",
        prompt: "Escolha a armadura do equipamento inicial",
        effect: { kind: "optionPick", options: ["Armadura de Couro Batido", "Cota de Escamas"] },
      },
    ],
  },
];

export const classFeatures: FeatureDefinition[] = [
  ...mechanicalClassFeatures,
  ...classSkillChoiceFeatures,
  ...classToolChoiceFeatures,
  ...namedClassFeatures,
  ...abilityScoreImprovementFeatures,
  ...epicBoonFeatures,
  ...artificeEquipmentChoiceFeatures,
  ...barbarianClassFeatures,
  ...barbarianWeaponMasteryFeatures,
  ...bardClassFeatures,
  ...clericClassFeatures,
  ...druidClassFeatures,
  ...fighterClassFeatures,
  ...monkClassFeatures,
  ...paladinClassFeatures,
  ...rangerClassFeatures,
  ...rogueClassFeatures,
  ...sorcererClassFeatures,
  ...warlockClassFeatures,
  ...wizardClassFeatures,
];
