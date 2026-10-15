import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Características da classe BASE do Guerreiro, estruturadas a partir
 * da fonte "COMPLETAR A CLASSE GUERREIRO NO BUILDER E NO PDF" —
 * substitui as entradas genéricas que existiam antes em
 * `NAMED_FEATURES_BY_CLASS.guerreiro` (nome+nível pendente de
 * conteúdo). As 4 SUBCLASSES (`data/features/subclasses.ts` +
 * `rules/fighterSubclassPrintedFeatures.ts`) são de uma fonte anterior
 * e não são tocadas aqui, exceto pela integração explicitamente pedida
 * da linha de Investida Mística no mesmo bloco "Surto de Ação" (ver
 * `rules/fighterClassPrintedFeatures.ts`).
 *
 * "Ajuste Tático" (5), "Mestre Tático" (9), "Dois Ataques Extras" (11),
 * "Indomável" (13/17) e "Surto de Ação" (17)/"Três Ataques Extras" (20)
 * têm `FeatureDefinition` própria (nomes reais da fonte), mas NUNCA
 * criam bloco impresso separado — só atualizam o texto de Recuperar
 * Fôlego/Maestria em Arma/Ataque Extra/Indomável/Surto de Ação já
 * existente.
 *
 * Omitido de propósito do campo impresso (continua existindo como
 * `FeatureDefinition`, só não aparece em "Características de Classe"):
 * "Estilo de Luta" — vai para a caixa de Talentos
 * (`rules/fighterTalentEntries.ts`), nunca como lembrete genérico de
 * "escolher Estilo de Luta". "Subclasse de Guerreiro" (estrutural,
 * etapa Classe), "Aumento no Valor de Atributo" e "Dádiva Épica"
 * (sistema de Talentos/ASI genérico, já cobre o Guerreiro via
 * `ASI_LEVELS_BY_CLASS`/`DADIVA_EPICA_CLASSES`).
 */

export const FIGHTER_FIGHTING_STYLE_CHOICE_ID = "guerreiro-estilo-de-luta-escolha";

export const fighterClassFeatures: FeatureDefinition[] = [
  {
    id: "guerreiro-estilo-de-luta-1",
    name: "Estilo de Luta",
    sourceType: "class",
    classId: "guerreiro",
    level: 1,
    autoGranted: false,
    summary:
      "Concede um talento de Estilo de Luta à escolha — categoria de talento condicional (`domain/features.ts#FeatureChoiceEffect`, variante `manualText`; catálogo de Estilos de Luta ainda pendente). Ao ganhar um nível de Guerreiro, pode substituir o talento escolhido por outro Estilo de Luta, removendo os efeitos do anterior — proficiências/concessões de outras origens nunca são afetadas. A concessão adicional do Campeão nível 7 (Estilo de Luta Adicional) é SEPARADA, com origem e quantidade próprias; nenhuma regra cadastrada estende a esta concessão de nível 1 a mesma troca ou vice-versa. Sem catálogo: registra a oportunidade com aviso de conteúdo pendente, nunca aceitando o texto livre como escolha validada nem criando bloqueio impossível de resolver (`rules/features.ts#isFeatureChoiceComplete` trata `manualText` como sempre incompleto o bastante para nunca travar o Avançar). No PDF, o nome escolhido (quando preenchido) aparece só na caixa Talentos (`rules/fighterTalentEntries.ts#getFighterFightingStyleTalentEntries`) — nunca em Características de Classe, nunca como lembrete genérico de \"escolher Estilo de Luta\".",
    choices: [
      {
        id: FIGHTER_FIGHTING_STYLE_CHOICE_ID,
        prompt: "Nível 1 — Estilo de Luta (catálogo de Estilos de Luta ainda pendente)",
        effect: { kind: "manualText", placeholder: "Estilo de Luta (catálogo pendente)" },
      },
    ],
  },
  {
    id: "guerreiro-maestria-em-arma-1",
    name: "Maestria em Arma",
    sourceType: "class",
    classId: "guerreiro",
    level: 1,
    autoGranted: true,
    summary:
      "Pode usar a propriedade de Maestria de tipos de arma Simples ou Marcial com os quais tenha proficiência — 3 tipos inicialmente, quantidade crescente por nível (rules/classResources.ts#getWeaponMasteryCount); ao completar um Descanso Longo, pode trocar UMA das escolhas (nunca todas de uma vez). Decisão tomada DURANTE O JOGO — nunca uma exigência permanente na criação do personagem nem uma lista de armas fixada no PDF. Nunca concede proficiência em arma por si só nem amplia o catálogo de armas/propriedades (data/weapons.ts#WEAPON_MASTERIES).",
  },
  {
    id: "guerreiro-recuperar-folego-1",
    name: "Recuperar Fôlego",
    sourceType: "class",
    classId: "guerreiro",
    level: 1,
    autoGranted: true,
    summary:
      "Ação Bônus: recupera 1d10 + nível de Guerreiro Pontos de Vida (rules/classResources.ts#getSecondWindHealingText — nunca BP nem nível total do personagem). Usos conforme a tabela de progressão (rules/classResources.ts#getSecondWindUses); um Descanso Curto recupera APENAS 1 uso gasto, um Descanso Longo recupera TODOS. Nunca aumenta PV máximos nem aplica a cura automaticamente na criação do personagem.",
  },
  {
    id: "guerreiro-mente-tatica-2",
    name: "Mente Tática",
    sourceType: "class",
    classId: "guerreiro",
    level: 2,
    autoGranted: true,
    summary:
      "Ao falhar em um teste de atributo, pode tentar usar um uso de Recuperar Fôlego: em vez de curar, rola 1d10 (nunca soma o nível de Guerreiro) e soma ao teste. Se o teste se tornar um sucesso, usa o novo resultado e gasta o uso; se continuar falhando, o uso NÃO é gasto. Compartilha a MESMA reserva de usos de Recuperar Fôlego — nunca cria um contador separado. A tentativa depende de ter ao menos 1 uso disponível. Nunca exige Ação Bônus (a tentativa em si não é uma ação), nunca concede cura, e nunca se aplica a jogadas de ataque ou Salvaguardas como se fossem testes de atributo. Impresso no mesmo bloco de Recuperar Fôlego — nunca um título separado.",
  },
  {
    id: "guerreiro-surto-de-acao-2",
    name: "Surto de Ação",
    sourceType: "class",
    classId: "guerreiro",
    level: 2,
    autoGranted: true,
    summary:
      "No próprio turno, pode executar uma ação adicional, exceto a ação Usar Magia (a Magia de Guerra do Cavaleiro Místico, que substitui ataques DENTRO da ação Atacar, continua funcionando normalmente — nunca uma proibição adicional). Usos conforme a tabela (rules/classResources.ts#getActionSurgeUsesCount: 1 dos níveis 2–16, 2 dos níveis 17–20), recuperados por completo em Descanso Curto ou Longo; no máximo UMA ativação por turno. A ação Atacar adicional usa a quantidade de ataques que o personagem possui naquele nível (nunca travada em 1). Nunca tratado como Ação Bônus.",
  },
  {
    id: "guerreiro-ajuste-tatico-5",
    name: "Ajuste Tático",
    sourceType: "class",
    classId: "guerreiro",
    level: 5,
    autoGranted: true,
    summary:
      "Sempre que usar a Ação Bônus de Recuperar Fôlego, pode mover até a metade do deslocamento sem provocar Ataques de Oportunidade. Nunca aumenta o deslocamento permanentemente, nunca consome um recurso separado, e nunca é ativado por Mente Tática (que não usa essa Ação Bônus). Impresso no mesmo bloco de Recuperar Fôlego — nunca um título separado.",
  },
  {
    id: "guerreiro-ataque-extra-5",
    name: "Ataque Extra",
    sourceType: "class",
    classId: "guerreiro",
    level: 5,
    autoGranted: true,
    summary:
      "Na ação Atacar do próprio turno, realiza 2 ataques em vez de 1 (já calculado em rules/classResources.ts#getExtraAttacksCount, consumido por rules/classProgression.ts) — nunca duplica o benefício.",
  },
  {
    id: "guerreiro-indomavel-9",
    name: "Indomável",
    sourceType: "class",
    classId: "guerreiro",
    level: 9,
    autoGranted: true,
    summary:
      "Ao falhar em uma Salvaguarda, pode rolar novamente, somando um bônus igual ao nível de Guerreiro à nova rolagem (rules/classResources.ts#getFighterIndomitableRerollUsesCount — recurso DIFERENTE do \"Incansável\" do Patrulheiro, mesmo nome em português só parecido); deve usar o novo resultado, mesmo se for pior — nunca escolhe entre os dois. O uso é gasto mesmo se a nova rolagem falhar de novo. 1 uso no nível 9, recuperado por completo em Descanso Longo (nunca Descanso Curto). Nunca soma o bônus permanentemente às Salvaguardas.",
  },
  {
    id: "guerreiro-mestre-tatico-9",
    name: "Mestre Tático",
    sourceType: "class",
    classId: "guerreiro",
    level: 9,
    autoGranted: true,
    summary:
      "Ao atacar com uma arma cuja propriedade de Maestria pode usar, pode substituir essa propriedade, só para aquele ataque, por Empurrar, Drenar ou Lentidão (data/weapons.ts#WEAPON_MASTERIES — propriedades já cadastradas no catálogo, nunca inventadas). Decisão POR ATAQUE — nunca uma escolha permanente no Builder. Nunca aplica as três propriedades simultaneamente nem as soma à propriedade substituída, e nunca concede Maestria em todas as armas. Impresso no mesmo bloco de Maestria em Arma — nunca um título separado.",
  },
  {
    id: "guerreiro-dois-ataques-extras-11",
    name: "Dois Ataques Extras",
    sourceType: "class",
    classId: "guerreiro",
    level: 11,
    autoGranted: true,
    summary:
      "Atualiza Ataque Extra — nunca um bloco impresso separado. A ação Atacar do próprio turno passa a ter 3 ataques no TOTAL (rules/classResources.ts#getExtraAttacksCount), substituindo a quantidade anterior — nunca soma 3 aos 2 anteriores.",
  },
  {
    id: "guerreiro-ataques-estudados-13",
    name: "Ataques Estudados",
    sourceType: "class",
    classId: "guerreiro",
    level: 13,
    autoGranted: true,
    summary:
      "Ao errar uma jogada de ataque contra uma criatura, recebe Vantagem na próxima jogada de ataque contra a MESMA criatura antes do fim do próprio próximo turno. Nunca restrito a ataques com arma, nunca concede Vantagem contra outros alvos, nunca se aplica automaticamente a todos os ataques seguintes, e nunca depende de gastar um recurso — nunca uma ativação permanente no Builder.",
  },
  {
    id: "guerreiro-indomavel-13",
    name: "Indomável",
    sourceType: "class",
    classId: "guerreiro",
    level: 13,
    autoGranted: true,
    summary: "Atualiza Indomável — nunca um bloco impresso separado. Usos passam a 2 (rules/classResources.ts#getFighterIndomitableRerollUsesCount).",
  },
  {
    id: "guerreiro-indomavel-17",
    name: "Indomável",
    sourceType: "class",
    classId: "guerreiro",
    level: 17,
    autoGranted: true,
    summary: "Atualiza Indomável — nunca um bloco impresso separado. Usos passam a 3 (rules/classResources.ts#getFighterIndomitableRerollUsesCount).",
  },
  {
    id: "guerreiro-surto-de-acao-17",
    name: "Surto de Ação",
    sourceType: "class",
    classId: "guerreiro",
    level: 17,
    autoGranted: true,
    summary: "Atualiza Surto de Ação — nunca um bloco impresso separado. Usos passam a 2 (rules/classResources.ts#getActionSurgeUsesCount).",
  },
  {
    id: "guerreiro-tres-ataques-extras-20",
    name: "Três Ataques Extras",
    sourceType: "class",
    classId: "guerreiro",
    level: 20,
    autoGranted: true,
    summary:
      "Atualiza Ataque Extra — nunca um bloco impresso separado. A ação Atacar do próprio turno passa a ter 4 ataques no TOTAL (rules/classResources.ts#getExtraAttacksCount), substituindo a quantidade anterior, sem duplicar títulos ou efeitos.",
  },
];
