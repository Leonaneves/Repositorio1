import { CLASS_IDS, type ClassId } from "../../domain/ids.js";
import type { FeatureDefinition } from "../../domain/features.js";
import { classes, getClassSkillChoiceId, getClassToolChoiceId } from "../classes.js";
import { barbarianClassFeatures, barbarianWeaponMasteryFeatures } from "./barbarian.js";
import { bardClassFeatures } from "./bard.js";

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
          effect: { kind: "skillProficiency", options: skillChoice.from, count: skillChoice.count },
        },
      ],
    } satisfies FeatureDefinition;
  },
);

/**
 * Uma feature "Ferramentas de Classe" por classe com `toolChoice`
 * confirmado (Bardo: 3 Instrumentos Musicais; Monge: 1 Ferramenta de
 * Artesão OU Instrumento Musical) — sempre nível 1, sempre com uma
 * `FeatureChoice` do tipo `toolProficiency` (entrada de texto livre:
 * não existe catálogo de instrumentos/ferramentas ainda, então o
 * jogador escreve, nunca escolhe de uma lista inventada). Classes com
 * concessão automática fixa (ex.: Druida → Kit de Herbalismo, Ladino →
 * Ferramentas de Ladrão) não entram aqui — não há escolha nenhuma a
 * registrar, só `toolProficiencyText`.
 */
const classToolChoiceFeatures: FeatureDefinition[] = CLASS_IDS.filter((classId) => classes[classId].toolChoice !== undefined).map(
  (classId) => {
    const toolChoice = classes[classId].toolChoice!;
    return {
      id: `${classId}-ferramentas-de-classe`,
      name: "Ferramentas de Classe",
      sourceType: "class",
      classId,
      level: 1,
      autoGranted: false,
      summary: `Escolha ${toolChoice.count} ${toolChoice.count === 1 ? "ferramenta" : "ferramentas"}: ${toolChoice.optionsText}.`,
      choices: [
        {
          id: getClassToolChoiceId(classId),
          prompt: `Escolha ${toolChoice.count} ${toolChoice.count === 1 ? "ferramenta" : "ferramentas"} de ${classes[classId].name} (${toolChoice.optionsText})`,
          effect: { kind: "toolProficiency", optionsText: toolChoice.optionsText, count: toolChoice.count },
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
  bruxo: [
    { name: "Invocações Místicas", level: 1 },
    { name: "Magia de Pacto", level: 1 },
    { name: "Astúcia Mágica", level: 2 },
    { name: "Contatar Patrono", level: 9 },
    { name: "Arcana Mística (6º círculo)", level: 11 },
    { name: "Arcana Mística (7º círculo)", level: 13 },
    { name: "Arcana Mística (8º círculo)", level: 15 },
    { name: "Arcana Mística (9º círculo)", level: 17 },
    { name: "Mestre Místico", level: 20 },
  ],
  clerigo: [
    { name: "Conjuração", level: 1 },
    { name: "Ordem Divina", level: 1 },
    { name: "Canalizar Divindade", level: 2 },
    { name: "Fulminar Mortos-Vivos", level: 5 },
    { name: "Golpes Abençoados", level: 7 },
    { name: "Intervenção Divina", level: 10 },
    { name: "Golpes Abençoados Aprimorado", level: 14 },
    { name: "Intervenção Divina Maior", level: 20 },
  ],
  druida: [
    { name: "Conjuração", level: 1 },
    { name: "Idioma Druídico", level: 1 },
    { name: "Ordem Primal", level: 1 },
    { name: "Companheiro Selvagem", level: 2 },
    { name: "Forma Selvagem", level: 2 },
    { name: "Ressurgimento Selvagem", level: 5 },
    { name: "Fúria Elemental", level: 7 },
    { name: "Fúria Elemental Aprimorada", level: 15 },
    { name: "Magias Bestiais", level: 18 },
    { name: "Arquidruida", level: 20 },
  ],
  feiticeiro: [
    { name: "Conjuração", level: 1 },
    { name: "Feitiçaria Inata", level: 1 },
    { name: "Fonte de Magia", level: 2 },
    { name: "Metamagia", level: 2 },
    { name: "Opções de Metamagia", level: 2 },
    { name: "Restauração Feiticeira", level: 5 },
    { name: "Feitiçaria Encarnada", level: 7 },
    { name: "Metamagia", level: 10 },
    { name: "Metamagia", level: 17 },
    { name: "Apoteose Arcana", level: 20 },
  ],
  guerreiro: [
    { name: "Estilo de Luta", level: 1 },
    { name: "Maestria em Arma", level: 1 },
    { name: "Recuperar Fôlego", level: 1 },
    { name: "Mente Tática", level: 2 },
    { name: "Surto de Ação", level: 2 },
    { name: "Ajuste Tático", level: 5 },
    { name: "Ataque Extra", level: 5 },
    { name: "Indomável", level: 9 },
    { name: "Mestre Tático", level: 9 },
    { name: "Dois Ataques Extras", level: 11 },
    { name: "Ataques Estudados", level: 13 },
    { name: "Indomável", level: 13 },
    { name: "Indomável", level: 17 },
    { name: "Surto de Ação", level: 17 },
    { name: "Três Ataques Extras", level: 20 },
  ],
  ladino: [
    { name: "Ataque Furtivo", level: 1 },
    { name: "Especialização", level: 1 },
    { name: "Gíria dos Ladrões", level: 1 },
    { name: "Maestria em Arma", level: 1 },
    { name: "Ação Ardilosa", level: 2 },
    { name: "Mira Firme", level: 3 },
    { name: "Esquiva Sobrenatural", level: 5 },
    { name: "Golpe Astuto", level: 5 },
    { name: "Especialista", level: 6 },
    { name: "Evasão", level: 7 },
    { name: "Talento Confiável", level: 7 },
    { name: "Golpe Astuto Aprimorado", level: 11 },
    { name: "Golpes Sujos", level: 14 },
    { name: "Mente Escorregadia", level: 15 },
    { name: "Elusivo", level: 18 },
    { name: "Golpe de Sorte", level: 20 },
  ],
  mago: [
    { name: "Adepto de Ritual", level: 1 },
    { name: "Conjuração", level: 1 },
    { name: "Recuperação Arcana", level: 1 },
    { name: "Acadêmico", level: 2 },
    { name: "Memorizar Magia", level: 5 },
    { name: "Maestria de Magias", level: 18 },
    { name: "Assinatura Mágica", level: 20 },
  ],
  monge: [
    { name: "Artes Marciais", level: 1 },
    { name: "Defesa sem Armadura", level: 1 },
    { name: "Foco do Monge", level: 2 },
    { name: "Metabolismo Incomum", level: 2 },
    { name: "Defletir Ataques", level: 3 },
    { name: "Ataque Extra", level: 5 },
    { name: "Golpe Atordoante", level: 5 },
    { name: "Ataques Potencializados", level: 6 },
    { name: "Evasão", level: 7 },
    { name: "Movimento Acrobático", level: 9 },
    { name: "Autocura", level: 10 },
    { name: "Foco Aprimorado", level: 10 },
    { name: "Defletir Energia", level: 13 },
    { name: "Sobrevivente Disciplinado", level: 14 },
    { name: "Foco Perfeito", level: 15 },
    { name: "Defesa Superior", level: 18 },
    { name: "Corpo e Mente", level: 20 },
  ],
  paladino: [
    { name: "Conjuração", level: 1 },
    { name: "Maestria em Arma", level: 1 },
    { name: "Mãos Consagradas", level: 1 },
    { name: "Destruição do Paladino", level: 2 },
    { name: "Estilo de Luta", level: 2 },
    { name: "Canalizar Divindade", level: 3 },
    { name: "Ataque Extra", level: 5 },
    { name: "Montaria Fiel", level: 5 },
    { name: "Aura de Proteção", level: 6 },
    { name: "Repudiar Inimigos", level: 9 },
    { name: "Aura de Coragem", level: 10 },
    { name: "Golpes Radiantes", level: 11 },
    { name: "Toque Restaurador", level: 14 },
    { name: "Aura Expandida", level: 18 },
  ],
  patrulheiro: [
    { name: "Conjuração", level: 1 },
    { name: "Inimigo Favorito", level: 1 },
    { name: "Maestria em Arma", level: 1 },
    { name: "Estilo de Luta", level: 2 },
    { name: "Explorador Hábil", level: 2 },
    { name: "Ataque Extra", level: 5 },
    { name: "Errante", level: 6 },
    { name: "Especialista", level: 9 },
    { name: "Incansável", level: 10 },
    { name: "Predador Implacável", level: 13 },
    { name: "Véu da Natureza", level: 14 },
    { name: "Caçador Preciso", level: 17 },
    { name: "Sentidos Selvagens", level: 18 },
    { name: "Matador de Inimigos Favoritos", level: 20 },
  ],
};

/**
 * Níveis de Aumento no Valor de Atributo confirmados por classe —
 * Guerreiro e Ladino recebem mais do que as demais. Artífice é a
 * única com ASI também no nível 19 (a própria tabela da fonte dá "Aumento
 * no Valor de Atributo" nesse nível, no lugar da Dádiva Épica — ver
 * `DADIVA_EPICA_CLASSES`, que exclui o Artífice por isso).
 */
const ASI_LEVELS_BY_CLASS: Partial<Record<ClassId, number[]>> = {
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
 * Bárbaro continua incluído (`ASI_LEVELS_BY_CLASS.barbaro` fica em
 * 4/8/12/16, igual às outras 11) mesmo tendo saído de
 * `NAMED_FEATURES_BY_CLASS` — por isso é somado explicitamente aqui,
 * não lido mais dali.
 */
const DADIVA_EPICA_CLASSES: ClassId[] = [
  ...(Object.keys(NAMED_FEATURES_BY_CLASS) as ClassId[]).filter((classId) => classId !== "artifice"),
  "barbaro",
  "bardo",
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
 * "Aumento no Valor de Atributo" (decisão §9 das regras de integração):
 * feature estruturada com uma escolha — fallback `manualText` até o
 * sistema de +2/+1 em atributos e o catálogo de talentos existirem.
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
        choices: [
          {
            id: `${classId}-asi-${level}-escolha`,
            prompt: "Aumento no Valor de Atributo ou Talento",
            effect: {
              kind: "manualText",
              placeholder: "Ex.: +2 em Força; ou +1 em Força e +1 em Constituição; ou um talento (catálogo pendente)",
            },
          },
        ],
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
];
