import type { FeatureDefinition } from "../../domain/features.js";
import { FIGHTING_STYLE_NAMES } from "../fightingStyles.js";

/**
 * Características da classe BASE do Paladino, estruturadas a partir da
 * fonte "IMPLEMENTAR PALADINO E SUAS SUBCLASSES NO BUILDER E NO PDF" —
 * substitui as entradas genéricas que existiam antes em
 * `NAMED_FEATURES_BY_CLASS.paladino` (nome+nível pendente de
 * conteúdo), mesmo padrão já usado para Guerreiro/Patrulheiro/Ladino/
 * Mago/Monge/Clérigo. As 4 SUBCLASSES (`data/features/subclasses.ts` +
 * `rules/paladinSubclassPrintedFeatures.ts`) são desta MESMA fonte.
 *
 * "Sentido Divino" é uma opção de Canalizar Divindade (como "Centelha
 * Divina"/"Expulsar Mortos-Vivos" do Clérigo) — `FeatureDefinition`
 * própria, mas NUNCA cria bloco impresso separado, só uma linha dentro
 * do bloco "Canalizar Divindade". "Aura de Coragem" (10) e "Aura
 * Expandida" (18) também têm `FeatureDefinition` própria mas apenas
 * atualizam o bloco de "Aura de Proteção" já existente. "Toque
 * Restaurador" (14) atualiza o bloco de "Mãos Consagradas".
 *
 * Omitido de propósito do campo impresso (continua existindo como
 * `FeatureDefinition`, só não aparece em "Características de Classe"):
 * "Conjuração" — atributo/CD/espaços/preparadas já têm campos próprios
 * na área de Magias; "Estilo de Luta" — vai para a caixa de Talentos
 * (`rules/fightingStyles.ts#getFightingStyleTalentEntries`), nunca como
 * lembrete genérico de "escolher Estilo de Luta"; "Subclasse de Paladino" (estrutural,
 * etapa Classe), "Aumento no Valor de Atributo" e "Dádiva Épica"
 * (sistema de Talentos/ASI genérico, já cobre o Paladino via
 * `ASI_LEVELS_BY_CLASS`/`DADIVA_EPICA_CLASSES`).
 */

export const PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID = "paladino-estilo-de-luta-ou-combatente-abencoado-escolha";
export const PALADIN_FIGHTING_STYLE_CHOICE_ID = "paladino-estilo-de-luta-escolha";
export const PALADIN_BLESSED_WARRIOR_CANTRIP_1_CHOICE_ID = "paladino-combatente-abencoado-truque-1-escolha";
export const PALADIN_BLESSED_WARRIOR_CANTRIP_2_CHOICE_ID = "paladino-combatente-abencoado-truque-2-escolha";

export const paladinClassFeatures: FeatureDefinition[] = [
  {
    id: "paladino-conjuracao-1",
    name: "Conjuração",
    sourceType: "class",
    classId: "paladino",
    level: 1,
    autoGranted: true,
    summary:
      "Atributo de conjuração: Carisma, usando o cálculo existente da CD de magia do personagem aplicável à conjuração de Paladino (rules/spellcasting.ts). Pode usar Símbolo Sagrado como foco. Inicialmente escolhe 2 magias de Paladino de 1º círculo; a cada Descanso Longo, pode substituir UMA magia preparada por outra elegível — nunca a lista inteira de uma vez. Espaços de magia recuperados em Descanso Longo (rules/spellcasting.ts#getSpellSlots). Magias escolhidas precisam ter círculo disponível na progressão de meio-conjurador de Paladino; magias sempre preparadas por outra característica (Destruição do Paladino, Montaria Fiel, magias de Juramento, truques de Combatente Abençoado) não consomem o limite normal de Magias Preparadas (rules/classResources.ts#getSpellsPreparedMax), mas contam como magias de Paladino. Destruição Cauterizante e Heroísmo são só recomendações, nunca concessões automáticas.",
  },
  {
    id: "paladino-maestria-em-arma-1",
    name: "Maestria em Arma",
    sourceType: "class",
    classId: "paladino",
    level: 1,
    autoGranted: true,
    summary:
      "Maestria em 2 tipos de arma nos quais tenha proficiência. Em Descanso Longo, pode alterar os tipos escolhidos — nunca limitado a trocar 1 arma por vez, nunca concede proficiência em armas por si só. Decisão operacional durante o jogo, nunca uma escolha permanente fixada na criação nem no PDF.",
  },
  {
    id: "paladino-maos-consagradas-1",
    name: "Mãos Consagradas",
    sourceType: "class",
    classId: "paladino",
    level: 1,
    autoGranted: true,
    summary:
      "Reserva máxima de PV = 5 × nível de Paladino (rules/classResources.ts#getMaosConsagradasMax), recupera por completo em Descanso Longo — representada no PDF como saldo/máximo (\"[____]/{máximo}\"), nunca como marcadores individuais. Ação Bônus + toque (pode direcionar a si mesmo): gasta pontos da reserva para recuperar a MESMA quantidade de PV no alvo, até o saldo disponível (nunca exige gastar tudo); OU gasta 5 pontos para remover Envenenado — pontos gastos para remover uma condição NÃO curam PV. A partir do nível 14 (Toque Restaurador): a MESMA Ação Bônus também pode gastar 5 pontos por condição para remover Amedrontado/Atordoado/Cego/Enfeitiçado/Paralisado/Surdo, além de Envenenado — nunca um contador ou ação adicional.",
  },
  {
    id: "paladino-destruicao-do-paladino-2",
    name: "Destruição do Paladino",
    sourceType: "class",
    classId: "paladino",
    level: 2,
    autoGranted: true,
    summary:
      "Destruição Divina fica sempre preparada, fora do limite normal de Magias Preparadas, e pode ser conjurada 1x por Descanso Longo sem gastar espaço (rules/paladinAutoPreparedSpells.ts) — preserva o tempo de conjuração e as demais regras da magia cadastrada; a conjuração gratuita não dispensa a ação normalmente exigida. A partir do nível 15 do Juramento da Devoção (Destruição Protetora): atualiza o MESMO benefício, nunca um bloco separado, concedendo Cobertura Parcial a você e aliados na Aura de Proteção até o início do próximo turno do Paladino.",
  },
  {
    id: "paladino-estilo-de-luta-2",
    name: "Estilo de Luta",
    sourceType: "class",
    classId: "paladino",
    level: 2,
    autoGranted: false,
    summary:
      "Escolha permanente ÚNICA entre um Estilo de Luta (`data/fightingStyles.ts`) e Combatente Abençoado — nunca as duas opções. Diferente do Guerreiro, o Paladino NUNCA pode substituir o Estilo de Luta escolhido ao ganhar nível. Se escolher Combatente Abençoado: seleciona 2 truques de Clérigo, que contam como magias de Paladino e usam Carisma; ao ganhar um nível de Paladino, pode substituir um desses truques por outro — e a sub-escolha de Estilo de Luta deixa de aparecer entre as escolhas pendentes desta característica (`rules/features.ts#getClassFeatures`), nunca permanecendo como exigência impossível de resolver. Chama Sagrada e Orientação são só recomendações, nunca concessões automáticas. Os truques de Combatente Abençoado aparecem na área de Magias (rules/paladinAutoPreparedSpells.ts); o nome do Estilo de Luta escolhido aparece só na caixa Talentos, com o texto automático do estilo quando houver (`rules/fightingStyles.ts#getFightingStyleTalentEntries`), nunca em Características de Classe nem como lembrete genérico de \"escolher Estilo de Luta\".",
    choices: [
      {
        id: PALADIN_FIGHTING_STYLE_OR_BLESSED_WARRIOR_CHOICE_ID,
        prompt: "Nível 2 — Estilo de Luta ou Combatente Abençoado",
        effect: { kind: "optionPick", options: ["Estilo de Luta", "Combatente Abençoado"] },
      },
      {
        id: PALADIN_FIGHTING_STYLE_CHOICE_ID,
        prompt: "Estilo de Luta",
        effect: { kind: "optionPick", options: FIGHTING_STYLE_NAMES },
      },
      {
        id: PALADIN_BLESSED_WARRIOR_CANTRIP_1_CHOICE_ID,
        prompt: "Combatente Abençoado — 1º truque de Clérigo (só se escolheu Combatente Abençoado acima)",
        effect: { kind: "manualText", placeholder: "Nome do 1º truque de Clérigo" },
      },
      {
        id: PALADIN_BLESSED_WARRIOR_CANTRIP_2_CHOICE_ID,
        prompt: "Combatente Abençoado — 2º truque de Clérigo (só se escolheu Combatente Abençoado acima)",
        effect: { kind: "manualText", placeholder: "Nome do 2º truque de Clérigo" },
      },
    ],
  },
  {
    id: "paladino-canalizar-divindade-3",
    name: "Canalizar Divindade",
    sourceType: "class",
    classId: "paladino",
    level: 3,
    autoGranted: true,
    summary:
      "Recurso ÚNICO, compartilhado por todas as opções de Canalizar Divindade do Paladino (Sentido Divino, Repudiar Inimigos) e do Juramento escolhido — nunca um conjunto de usos separado por opção. Quantidade de usos conforme o nível: 2 dos níveis 3-10, 3 a partir do 11 (rules/classResources.ts#getChannelDivinityUses, mesma função já usada pelo Clérigo); recupera +1 uso em Descanso Curto, todos em Descanso Longo — NUNCA toda a reserva em Descanso Curto. A CD de qualquer efeito de Canalizar Divindade é a MESMA CD de magia de Paladino (Carisma), já calculada pela conjuração — nunca uma CD independente nem escolha de atributo.",
  },
  {
    id: "paladino-sentido-divino-3",
    name: "Sentido Divino",
    sourceType: "class",
    classId: "paladino",
    level: 3,
    autoGranted: true,
    summary:
      "Opção de Canalizar Divindade (Ação Bônus). Por 10 minutos ou até ficar Incapacitado: sabe a localização e o tipo de Celestiais, Ínferos e Mortos-Vivos a até 18m, e detecta a presença de lugares/objetos consagrados ou profanados nesse raio — nunca exige que as criaturas estejam à vista.",
  },
  {
    id: "paladino-ataque-extra-5",
    name: "Ataque Extra",
    sourceType: "class",
    classId: "paladino",
    level: 5,
    autoGranted: true,
    summary: "Ataca duas vezes, em vez de uma, ao usar a Ação de Atacar no próprio turno (rules/classResources.ts#getExtraAttacksCount). Nunca somado a um benefício equivalente de outra classe.",
  },
  {
    id: "paladino-montaria-fiel-5",
    name: "Montaria Fiel",
    sourceType: "class",
    classId: "paladino",
    level: 5,
    autoGranted: true,
    summary:
      "Convocar Montaria fica sempre preparada, fora do limite normal de Magias Preparadas, e pode ser conjurada 1x por Descanso Longo sem gastar espaço (rules/paladinAutoPreparedSpells.ts) — preserva as demais regras da magia. Nunca cria uma seleção permanente da montaria nem inclui o bloco de estatísticas dela no PDF.",
  },
  {
    id: "paladino-aura-de-protecao-6",
    name: "Aura de Proteção",
    sourceType: "class",
    classId: "paladino",
    level: 6,
    autoGranted: true,
    summary:
      "Emanação centrada no próprio Paladino: 3m dos níveis 6-17, 9m a partir do nível 18 (Aura Expandida — rules/classResources.ts#getPaladinAuraRange, nunca um bloco impresso separado). Inativa enquanto o Paladino estiver Incapacitado. Você e aliados na aura recebem bônus nas Salvaguardas = máximo(1, mod CAR) (rules/classResources.ts#getPaladinAuraBonus). Uma criatura só pode se beneficiar de UMA Aura de Proteção por vez, escolhendo qual quando há mais de um Paladino — nunca soma bônus de vários Paladinos. A partir do nível 10 (Aura de Coragem): você e aliados na aura também têm Imunidade a Amedrontado — se um aliado já Amedrontado entrar na aura, a condição fica SEM EFEITO enquanto ele permanecer nela, nunca removida definitivamente. Benefícios adicionais de aura concedidos pelo Juramento (Devoção/Glória/Vingança/Anciões) atualizam o MESMO bloco, nunca um título separado.",
  },
  {
    id: "paladino-repudiar-inimigos-9",
    name: "Repudiar Inimigos",
    sourceType: "class",
    classId: "paladino",
    level: 9,
    autoGranted: true,
    summary:
      "Opção de Canalizar Divindade (Ação de Usar Magia). Apresenta o Símbolo Sagrado ou uma arma e escolhe até máximo(1, mod CAR) criaturas visíveis a até 18m (rules/classResources.ts#getRepudiarInimigosTargetCount). Cada uma faz Salvaguarda de Sabedoria contra a CD de magia do Paladino; falha: fica Amedrontada por 1 minuto ou até sofrer qualquer dano — enquanto estiver Amedrontada por este efeito, no próprio turno só pode se mover, executar uma ação OU uma Ação Bônus (nunca as três juntas, nunca uma repetição de Salvaguarda que o texto não concede).",
  },
  {
    id: "paladino-aura-de-coragem-10",
    name: "Aura de Coragem",
    sourceType: "class",
    classId: "paladino",
    level: 10,
    autoGranted: true,
    summary: "Atualiza Aura de Proteção — nunca um bloco impresso separado. Ver resumo de Aura de Proteção (Imunidade a Amedrontado na aura).",
  },
  {
    id: "paladino-golpes-radiantes-11",
    name: "Golpes Radiantes",
    sourceType: "class",
    classId: "paladino",
    level: 11,
    autoGranted: true,
    summary:
      "Ao acertar com uma arma Corpo a Corpo OU com Ataque Desarmado, causa +1d8 de dano Radiante — não limitado a uma vez por turno. A exigência é usar uma arma Corpo a Corpo, não necessariamente realizar um ataque corpo a corpo: ataques de arremesso com essas armas continuam elegíveis. Nunca aplicado a armas à Distância ou a ataques de magia.",
  },
  {
    id: "paladino-toque-restaurador-14",
    name: "Toque Restaurador",
    sourceType: "class",
    classId: "paladino",
    level: 14,
    autoGranted: true,
    summary:
      "Atualiza Mãos Consagradas — nunca um bloco impresso separado ou contador novo. Ao usar Mãos Consagradas, também pode remover Amedrontado, Atordoado, Cego, Enfeitiçado, Paralisado ou Surdo, cada condição custando 5 pontos da reserva (mesmo custo e mesma regra de \"não cura PV\" já aplicada a Envenenado).",
  },
  {
    id: "paladino-aura-expandida-18",
    name: "Aura Expandida",
    sourceType: "class",
    classId: "paladino",
    level: 18,
    autoGranted: true,
    summary:
      "Atualiza Aura de Proteção — nunca um bloco impresso separado. O alcance passa de 3m para 9m (rules/classResources.ts#getPaladinAuraRange). Benefícios que se referem à Aura de Proteção acompanham este alcance; alcances INDEPENDENTES (3m de Defesa Gloriosa, 4,5m de A Ira da Natureza) nunca aumentam.",
  },
];
