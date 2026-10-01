import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Características de CLASSE do Bardo, estruturadas a partir da fonte
 * "INTEGRAÇÃO COMPLETA — BARDO E SUBCLASSES" — substitui as entradas
 * genéricas que existiam antes em `NAMED_FEATURES_BY_CLASS.bardo`
 * (nome+nível pendente de conteúdo). Mesma `FeatureDefinition` por
 * característica mesmo quando ela evolui em nível posterior (Inspiração
 * de Bardo no 5/18) — a evolução fica no texto impresso dinâmico
 * (`rules/bardPrintedFeatures.ts`), nunca numa segunda `FeatureDefinition`.
 *
 * "Especialista" aparece 2 vezes (níveis 2 e 9) de propósito — mesmo
 * padrão já usado para "Maestria em Arma" do Bárbaro: cada nível
 * desbloqueia 2 escolhas de Especialização independentes, nunca um
 * único choice com count mutável.
 *
 * Omitidas de propósito do campo impresso (ver `BARD_NEVER_PRINTED`
 * em `rules/bardPrintedFeatures.ts` para a razão de cada uma — aqui
 * continuam existindo como `FeatureDefinition`, só não aparecem no
 * texto compacto): "Conjuração", "Especialista", "Pau pra Toda Obra",
 * "Subclasse de Bardo" (nem chega a existir como FeatureDefinition —
 * é estrutural, tratada pela etapa 3 do Builder), "Aumento no Valor de
 * Atributo" (sistema de talentos existente), "Fonte de Inspiração",
 * "Segredos Mágicos", "Inspiração Superior", "Dádiva Épica" (sistema de
 * talentos existente).
 */

export function getBardSkillExpertiseChoiceId(slot: 1 | 2): string {
  return `bardo-especialista-${slot}-escolha`;
}

export const CONHECIMENTO_PROFICIENCIAS_BONUS_CHOICE_ID = "bardo-conhecimento-proficiencias-bonus-escolha";

export const bardClassFeatures: FeatureDefinition[] = [
  {
    id: "bardo-inspiracao-de-bardo-1",
    name: "Inspiração de Bardo",
    sourceType: "class",
    classId: "bardo",
    level: 1,
    autoGranted: true,
    summary:
      "Ação Bônus: outra criatura a até 18m que possa ver/ouvir você recebe 1 dado de Inspiração de Bardo (máx. 1 por vez, dura até 1h) — ao falhar em um teste de D20, pode rolar o dado e somar (gasta o dado). Usos = modificador de CAR, mínimo 1; recuperação inicial: todos após Descanso Longo. Tamanho do dado conforme nível (rules/classResources.ts#getBardicInspirationDie): 1-4 d6, 5-9 d8, 10-14 d10, 15-20 d12. A partir do nível 5 (Fonte de Inspiração) e do nível 18 (Inspiração Superior), a MESMA característica passa a ter recuperação/recarga adicionais — nunca um bloco separado.",
  },
  {
    id: "bardo-conjuracao-1",
    name: "Conjuração",
    sourceType: "class",
    classId: "bardo",
    level: 1,
    autoGranted: true,
    summary:
      "Atributo de conjuração: Carisma. Foco: Instrumento Musical. Truques/Magias Preparadas/Espaços de Magia seguem a tabela de progressão da classe (rules/classProgression.ts). Seleção de Truques/Magias Preparadas e substituições ao subir de nível são feitas na área de Magias, nunca neste campo.",
  },
  {
    id: "bardo-especialista-1",
    name: "Especialista",
    sourceType: "class",
    classId: "bardo",
    level: 2,
    autoGranted: false,
    summary:
      "Escolha 2 perícias nas quais já é proficiente — recebem Especialização (dobra o bônus de proficiência). Nunca concede a proficiência em si; aplicado direto no valor da perícia (rules/skills.ts#getSkillExpertise).",
    choices: [
      {
        id: getBardSkillExpertiseChoiceId(1),
        prompt: "Especialista — escolha 2 perícias já proficientes",
        effect: { kind: "skillExpertise", count: 2 },
      },
    ],
  },
  {
    id: "bardo-pau-pra-toda-obra-2",
    name: "Pau pra Toda Obra",
    sourceType: "class",
    classId: "bardo",
    level: 2,
    autoGranted: true,
    summary:
      "Em testes de atributo associados a uma perícia na qual NÃO é proficiente (e que não recebe o Bônus de Proficiência por outra fonte): soma metade do Bônus de Proficiência, arredondado para baixo (Prof +2/+3→+1, +4/+5→+2, +6→+3). Aplicado direto no valor das perícias não proficientes elegíveis (rules/skills.ts#getJackOfAllTradesBonus); nunca altera Iniciativa, Salvaguardas, Ataques, CDs ou qualquer teste que não seja de perícia. Não torna a perícia proficiente.",
  },
  {
    id: "bardo-fonte-de-inspiracao-5",
    name: "Fonte de Inspiração",
    sourceType: "class",
    classId: "bardo",
    level: 5,
    autoGranted: true,
    summary:
      "Inspiração de Bardo passa a recuperar todos os usos também após Descanso Curto (além do Longo); alternativamente, pode gastar 1 espaço de magia (nenhuma ação) para recuperar 1 uso. Atualiza o mesmo bloco de Inspiração de Bardo — nunca um bloco separado.",
  },
  {
    id: "bardo-contra-encantamento-7",
    name: "Contra-Encantamento",
    sourceType: "class",
    classId: "bardo",
    level: 7,
    autoGranted: true,
    summary:
      "Reação: quando você ou uma criatura a até 9m falha uma salvaguarda contra um efeito que aplicaria Amedrontado ou Enfeitiçado, refaça a salvaguarda com Vantagem.",
  },
  {
    id: "bardo-especialista-2",
    name: "Especialista",
    sourceType: "class",
    classId: "bardo",
    level: 9,
    autoGranted: false,
    summary: "Escolha mais 2 perícias (já proficientes) para Especialização — total de 4 perícias especializadas.",
    choices: [
      {
        id: getBardSkillExpertiseChoiceId(2),
        prompt: "Especialista — escolha mais 2 perícias já proficientes",
        effect: { kind: "skillExpertise", count: 2 },
      },
    ],
  },
  {
    id: "bardo-segredos-magicos-10",
    name: "Segredos Mágicos",
    sourceType: "class",
    classId: "bardo",
    level: 10,
    autoGranted: true,
    summary:
      "A partir deste nível, sempre que a progressão de Magias Preparadas aumentar, novas magias podem ser escolhidas das listas de Clérigo, Druida ou Mago (além da de Bardo) — contam como magias de Bardo. Ao substituir uma magia preparada de Bardo ao subir de nível, também pode substituí-la por uma dessas listas. Sem catálogo estruturado de magias no projeto: a escolha continua sendo feita na lista manual de Magias Preparadas da área de Magias (Character.spellsPrepared), nunca neste campo.",
  },
  {
    id: "bardo-inspiracao-superior-18",
    name: "Inspiração Superior",
    sourceType: "class",
    classId: "bardo",
    level: 18,
    autoGranted: true,
    summary:
      "Ao rolar Iniciativa, se tiver menos de 2 usos restantes de Inspiração de Bardo, recupere usos até ficar com 2. Atualiza o mesmo bloco de Inspiração de Bardo — nunca um bloco separado.",
  },
  {
    id: "bardo-palavras-de-criacao-20",
    name: "Palavras de Criação",
    sourceType: "class",
    classId: "bardo",
    level: 20,
    autoGranted: true,
    summary:
      "Palavra de Poder: Matar e Palavra de Poder: Salvar ficam sempre preparadas (entram automaticamente na área de Magias, rules/bardAutoPreparedSpells.ts — nunca neste campo). Ao conjurar qualquer uma delas, pode escolher uma segunda criatura a até 3m do primeiro alvo para também ser afetada.",
  },
];
