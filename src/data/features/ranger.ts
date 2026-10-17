import type { FeatureDefinition } from "../../domain/features.js";
import { FIGHTING_STYLE_NAMES } from "../fightingStyles.js";

/**
 * Características da classe BASE do Patrulheiro, estruturadas a partir
 * da fonte "COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF" —
 * substitui as entradas genéricas que existiam antes em
 * `NAMED_FEATURES_BY_CLASS.patrulheiro` (nome+nível pendente de
 * conteúdo). As 4 SUBCLASSES (`data/features/subclasses.ts` +
 * `rules/rangerSubclassPrintedFeatures.ts`) são de uma fonte anterior
 * e não são tocadas aqui, exceto pela integração explicitamente pedida
 * do bloco único "Marca do Predador" (ver `rules/rangerClassPrintedFeatures.ts`).
 *
 * "Predador Implacável" (13), "Caçador Preciso" (17) e "Matador de
 * Inimigos Favoritos" (20) têm `FeatureDefinition` própria (nomes reais
 * da fonte), mas NUNCA criam bloco impresso separado — só atualizam o
 * texto de "Inimigo Favorito"/Marca do Predador.
 *
 * Omitidas de propósito do campo impresso (continuam existindo como
 * `FeatureDefinition`, só não aparecem em "Características de Classe"):
 * "Conjuração" (campos próprios de Conjuração), "Explorador Hábil" e
 * "Especialista" (Especialização nas Perícias, idiomas no campo de
 * Idiomas), "Subclasse de Patrulheiro" (estrutural, etapa Classe),
 * "Aumento no Valor de Atributo" e "Dádiva Épica" (sistema de
 * Talentos/ASI genérico, já cobre o Patrulheiro via
 * `ASI_LEVELS_BY_CLASS`/`DADIVA_EPICA_CLASSES`).
 */

export const RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID = "patrulheiro-estilo-de-luta-ou-combatente-druidico-escolha";
export const RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID = "patrulheiro-estilo-de-luta-talento-escolha";
export const RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID = "patrulheiro-explorador-habil-especializacao-escolha";
export const RANGER_ESPECIALISTA_EXPERTISE_CHOICE_ID = "patrulheiro-especialista-especializacao-escolha";

/** Id estável do N-ésimo (1-2) truque de Combatente Druídico — usado por `rules/rangerAutoPreparedSpells.ts`. */
export function getRangerDruidicWarriorCantripChoiceId(slot: 1 | 2): string {
  return `patrulheiro-combatente-druidico-truque-${slot}-escolha`;
}

export const rangerClassFeatures: FeatureDefinition[] = [
  {
    id: "patrulheiro-conjuracao-1",
    name: "Conjuração",
    sourceType: "class",
    classId: "patrulheiro",
    level: 1,
    autoGranted: true,
    summary:
      "Conjuração (atributo Sabedoria; pode usar Foco Druídico). Espaços de magia e quantidade de Magias Preparadas conforme o nível (rules/spellcasting.ts#getSpellSlots — progressão de meio-conjurador; rules/classResources.ts#getSpellsPreparedMax). Prepara inicialmente 2 magias de 1º círculo da lista de Patrulheiro; ao ganhar nova capacidade da tabela (mais Magias Preparadas), escolhe mais magias — as escolhidas sempre precisam ter círculo para o qual possui espaços dessa progressão. Recupera todos os espaços gastos em Descanso Longo. A cada Descanso Longo, pode substituir UMA magia preparada por outra elegível (nunca a lista inteira). Curar Ferimentos e Golpe Constritor são recomendações, não concessões automáticas. Magias sempre preparadas por outra característica de Patrulheiro (Marca do Predador e as concessões das subclasses) não contam contra esta quantidade, mas contam como magias de Patrulheiro e mantêm sua própria origem (rules/rangerAutoPreparedSpells.ts). Sem catálogo completo de magias no projeto: truques/magias preparadas usam o campo de texto livre já existente para todo conjurador, nunca validados só pelo nome digitado. Não impresso em Características de Classe — usa os campos próprios de Conjuração.",
  },
  {
    id: "patrulheiro-inimigo-favorito-1",
    name: "Inimigo Favorito",
    sourceType: "class",
    classId: "patrulheiro",
    level: 1,
    autoGranted: true,
    summary:
      "Marca do Predador fica sempre preparada (rules/rangerAutoPreparedSpells.ts — conta como magia de Patrulheiro, nunca consome a quantidade de Magias Preparadas da tabela). Além de conjurá-la normalmente gastando um espaço de magia, pode conjurá-la SEM espaço um número de vezes igual à coluna 'Inimigo Favorito' da tabela de progressão (rules/classResources.ts#getFavoredEnemyCount — depende do NÍVEL DE PATRULHEIRO, nunca do BP, mesmo quando os números coincidirem num personagem de classe única); esses usos são um contador PRÓPRIO, separado dos espaços de magia, recuperado por completo em Descanso Longo — nunca duplica a magia para representar as duas formas de conjuração. O dado de dano da Marca do Predador é 1d6, substituído por 1d10 a partir do nível 20 (Matador de Inimigos Favoritos; rules/classResources.ts#getFavoredEnemyDie). A regra completa da magia (alvo, duração, demais efeitos) ainda não tem catálogo — registrada aqui só a referência e os dados fornecidos (dado de dano, usos gratuitos), nunca inventando o restante. A quantidade de conjurações gratuitas NUNCA é tratada como limite de ataques beneficiados nem de ativações do dano adicional.",
  },
  {
    id: "patrulheiro-maestria-em-arma-1",
    name: "Maestria em Arma",
    sourceType: "class",
    classId: "patrulheiro",
    level: 1,
    autoGranted: true,
    summary:
      "Pode usar a propriedade de Maestria de 2 tipos de arma com os quais tenha proficiência; pode trocar os 2 tipos ao completar um Descanso Longo. Arcos Longos e Espadas Curtas são só exemplos dados pela fonte, nunca escolhas automáticas. Nunca concede proficiência em arma por si só. Decisão tomada DURANTE O JOGO (pode mudar a cada Descanso Longo) — nunca uma escolha permanente do Builder nem duas armas fixadas na criação do personagem.",
  },
  {
    id: "patrulheiro-estilo-de-luta-2",
    name: "Estilo de Luta",
    sourceType: "class",
    classId: "patrulheiro",
    level: 2,
    autoGranted: false,
    summary:
      "Escolha permanente entre um Estilo de Luta (`data/fightingStyles.ts`, concessão/origem própria e independente de outras classes) e Combatente Druídico: escolhe 2 truques da lista de Druida (Sabedoria é o atributo de conjuração deles; contam como magias de Patrulheiro, aparecem na área de Magias — rules/rangerAutoPreparedSpells.ts; ao ganhar nível de Patrulheiro, pode substituir um dos dois). As duas opções são ALTERNATIVAS, nunca concessões cumulativas desta característica — ao escolher Combatente Druídico, a sub-escolha de Estilo de Luta deixa de aparecer entre as escolhas pendentes desta característica (`rules/features.ts#getClassFeatures`), nunca permanecendo como exigência impossível de resolver. Fagulha Estelar e Orientação são recomendações para Combatente Druídico, nunca escolhas automáticas. Sem catálogo de truques de Druida: usa o mesmo fallback de texto livre já aprovado para casos assim (ex.: Xamã do Druida), nunca inventando truques ou seus efeitos. Ao trocar entre as duas opções, remove só os benefícios da opção abandonada — proficiências/conjurações de outras origens nunca são afetadas.",
    choices: [
      {
        id: RANGER_FIGHTING_STYLE_OR_DRUIDIC_CHOICE_ID,
        prompt: "Nível 2: Estilo de Luta ou Combatente Druídico",
        effect: { kind: "optionPick", options: ["Estilo de Luta", "Combatente Druídico"] },
      },
      {
        id: RANGER_FIGHTING_STYLE_TALENT_CHOICE_ID,
        prompt: "Estilo de Luta",
        effect: { kind: "optionPick", options: FIGHTING_STYLE_NAMES },
      },
      {
        id: getRangerDruidicWarriorCantripChoiceId(1),
        prompt: "Combatente Druídico — 1º truque de Druida (só se escolher Combatente Druídico)",
        effect: { kind: "manualText", placeholder: "Nome do 1º truque de Druida" },
      },
      {
        id: getRangerDruidicWarriorCantripChoiceId(2),
        prompt: "Combatente Druídico — 2º truque de Druida (só se escolher Combatente Druídico)",
        effect: { kind: "manualText", placeholder: "Nome do 2º truque de Druida" },
      },
    ],
  },
  {
    id: "patrulheiro-explorador-habil-2",
    name: "Explorador Hábil",
    sourceType: "class",
    classId: "patrulheiro",
    level: 2,
    autoGranted: false,
    summary:
      "Escolhe 1 perícia na qual já é proficiente e ainda sem Especialização: recebe Especialização (dobra o Bônus de Proficiência — rules/skills.ts#getSkillExpertise), nunca concede proficiência em perícia nova no lugar. Também ganha 2 idiomas à escolha — o projeto ainda não tem catálogo estruturado de idiomas (`Character.languages` é texto livre); registre-os diretamente nesse campo, como pendência de validação contra um catálogo real, nunca uma escolha fictícia. Nunca impresso em Características de Classe: a Especialização aparece nas Perícias, os idiomas no campo de Idiomas.",
    choices: [
      {
        id: RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID,
        prompt: "Explorador Hábil — escolha 1 perícia já proficiente, ainda sem Especialização",
        effect: { kind: "skillExpertise", count: 1 },
      },
    ],
  },
  {
    id: "patrulheiro-ataque-extra-5",
    name: "Ataque Extra",
    sourceType: "class",
    classId: "patrulheiro",
    level: 5,
    autoGranted: true,
    summary:
      "Na ação Atacar do próprio turno, pode realizar 2 ataques em vez de 1 (já calculado em rules/classResources.ts#getExtraAttacksCount) — nunca concede uma ação adicional nem duplica o benefício.",
  },
  {
    id: "patrulheiro-errante-6",
    name: "Errante",
    sourceType: "class",
    classId: "patrulheiro",
    level: 6,
    autoGranted: true,
    summary:
      "+3m de deslocamento enquanto não estiver usando Armadura Pesada (rules/speed.ts#getClassSpeedBonus — somado ao deslocamento efetivo, nunca duas vezes). Deslocamento de Escalada e de Natação passam a ser iguais a esse deslocamento efetivo, JÁ incluindo o +3m quando permitido (rules/speed.ts#getRangerClimbSpeed/getRangerSwimSpeed) — nunca soma o +3m de novo a esses dois.",
  },
  {
    id: "patrulheiro-especialista-9",
    name: "Especialista",
    sourceType: "class",
    classId: "patrulheiro",
    level: 9,
    autoGranted: false,
    summary:
      "Escolhe 2 perícias distintas, nas quais já é proficiente e ainda sem Especialização: cada uma recebe Especialização (rules/skills.ts#getSkillExpertise). Preserva a escolha anterior de Explorador Hábil e nunca reaplica Especialização a uma perícia que já a tenha.",
    choices: [
      {
        id: RANGER_ESPECIALISTA_EXPERTISE_CHOICE_ID,
        prompt: "Especialista — escolha 2 perícias já proficientes, ainda sem Especialização",
        effect: { kind: "skillExpertise", count: 2 },
      },
    ],
  },
  {
    id: "patrulheiro-incansavel-10",
    name: "Incansável",
    sourceType: "class",
    classId: "patrulheiro",
    level: 10,
    autoGranted: true,
    summary:
      "Ação Usar Magia: concede a si mesmo máximo(1, resultado de 1d8 + modificador de Sabedoria) Pontos de Vida Temporários (rules/classResources.ts#getIndomitableTempHpText — o mínimo 1 vale para o TOTAL obtido, nunca transforma um modificador negativo de Sabedoria em +1). Usos = máximo(1, modificador de Sabedoria) (rules/classResources.ts#getIndomitableUsesCount), todos recuperados em Descanso Longo; ao completar um Descanso Curto, reduz a Exaustão em 1 se houver (nunca abaixo de 0). Nunca concede esses PV Temporários automaticamente na criação do personagem nem aumenta PV máximos.",
  },
  {
    id: "patrulheiro-predador-implacavel-13",
    name: "Predador Implacável",
    sourceType: "class",
    classId: "patrulheiro",
    level: 13,
    autoGranted: true,
    summary:
      "Atualiza Marca do Predador — nunca um bloco impresso separado. Sofrer dano nunca quebra a Concentração especificamente na magia Marca do Predador (a exigência de Concentração dessa magia continua existindo normalmente); o benefício não se estende a nenhuma outra magia nem a outras causas de perda de Concentração.",
  },
  {
    id: "patrulheiro-veu-da-natureza-14",
    name: "Véu da Natureza",
    sourceType: "class",
    classId: "patrulheiro",
    level: 14,
    autoGranted: true,
    summary:
      "Ação Bônus: fica Invisível até o fim do seu próximo turno. Usos = máximo(1, modificador de Sabedoria) (rules/classResources.ts#getNatureVeilUsesCount) — recurso SEPARADO de Incansável, mesmo tendo a mesma fórmula de quantidade; recupera todos em Descanso Longo. Nunca concede invisibilidade permanente.",
  },
  {
    id: "patrulheiro-cacador-preciso-17",
    name: "Caçador Preciso",
    sourceType: "class",
    classId: "patrulheiro",
    level: 17,
    autoGranted: true,
    summary:
      "Atualiza Marca do Predador — nunca um bloco impresso separado. Vantagem em jogadas de ataque contra a criatura marcada pela própria Marca do Predador — nunca restrito a ataques com arma (a fonte não faz essa restrição) nem estendido a todos os ataques do personagem.",
  },
  {
    id: "patrulheiro-sentidos-selvagens-18",
    name: "Sentidos Selvagens",
    sourceType: "class",
    classId: "patrulheiro",
    level: 18,
    autoGranted: true,
    summary:
      "Visão às Cegas 9m. Soma-se ao sistema de sentidos do personagem, preservando Visão no Escuro e qualquer outro sentido de outra origem — nunca os substitui.",
  },
  {
    id: "patrulheiro-matador-de-inimigos-favoritos-20",
    name: "Matador de Inimigos Favoritos",
    sourceType: "class",
    classId: "patrulheiro",
    level: 20,
    autoGranted: true,
    summary:
      "Atualiza Marca do Predador — nunca um bloco impresso separado. O dado de dano da Marca do Predador passa de 1d6 para 1d10 (já resolvido por rules/classResources.ts#getFavoredEnemyDie); toda referência ao dano adicional dessa magia — incluindo Presa do Caçador Superior do Caçador e Fúria Bestial do Senhor das Feras — usa essa mesma fonte, nunca um valor duplicado. Nunca soma o 1d10 ao 1d6 anterior.",
  },
];
