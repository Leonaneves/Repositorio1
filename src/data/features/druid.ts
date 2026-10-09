import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Características de CLASSE do Druida, estruturadas a partir da fonte
 * "INTEGRAÇÃO COMPLETA — DRUIDA E SUBCLASSES" — substitui as entradas
 * genéricas que existiam antes em `NAMED_FEATURES_BY_CLASS.druida`
 * (nome+nível pendente de conteúdo).
 *
 * Mesma `FeatureDefinition` por característica mesmo quando ela evolui
 * em nível posterior (Forma Selvagem recebe Ressurgimento Selvagem no
 * 5, Magias Bestiais no 18, Arquidruida no 20; Ataque Primal/Conjuração
 * Poderosa evoluem no 15) — a evolução fica no texto impresso dinâmico
 * (`rules/druidPrintedFeatures.ts`), nunca numa segunda
 * `FeatureDefinition`. "Ressurgimento Selvagem", "Magias Bestiais" e
 * "Arquidruida" têm `FeatureDefinition` própria (nomes reais da fonte),
 * mas NUNCA criam bloco impresso separado — só atualizam o texto de
 * "Forma Selvagem".
 *
 * Omitidas de propósito do campo impresso (continuam existindo como
 * `FeatureDefinition`, só não aparecem em "Características de Classe"
 * — ver `rules/druidPrintedFeatures.ts`): "Conjuração", "Ordem
 * Primal" (resolvida em Perícias/Proficiências/Magias, nunca precisa
 * ocupar este campo), "Subclasse de Druida" (estrutural, etapa 3 do
 * Builder), "Aumento no Valor de Atributo" e "Dádiva Épica" (sistema
 * de Talentos/ASI genérico, já cobre o Druida via
 * `ASI_LEVELS_BY_CLASS`/`DADIVA_EPICA_CLASSES`).
 */

export const ORDEM_PRIMAL_CHOICE_ID = "druida-ordem-primal-escolha";
export const XAMA_TRUQUE_CHOICE_ID = "druida-xama-truque-escolha";
export const FURIA_ELEMENTAL_CHOICE_ID = "druida-furia-elemental-escolha";

export const druidClassFeatures: FeatureDefinition[] = [
  {
    id: "druida-conjuracao-1",
    name: "Conjuração",
    sourceType: "class",
    classId: "druida",
    level: 1,
    autoGranted: true,
    summary:
      "Conjuração completa (atributo Sabedoria, foco Foco Druídico). Prepara magias da lista de Druida — quantidade de Truques/Magias Preparadas conforme o nível (rules/classResources.ts#getCantripsKnown/#getSpellsPreparedMax). Após um Descanso Longo, pode redefinir toda a lista de Magias Preparadas. Magias sempre preparadas por outra característica (Idioma Druídico, Companheiro Selvagem, Magias de Círculo, Mapa Estelar) não contam contra o limite normal, mas contam como magias de Druida. Truques/Magias Preparadas/Espaços/CD/Ataque de magia/magias sempre preparadas ficam todos na área de Magias, nunca neste campo.",
  },
  {
    id: "druida-idioma-druidico-1",
    name: "Idioma Druídico",
    sourceType: "class",
    classId: "druida",
    level: 1,
    autoGranted: true,
    summary:
      "Adiciona Druídico à área de Idiomas. Falar com Animais fica sempre preparada (origem: Idioma Druídico — rules/druidAutoPreparedSpells.ts), sem contar contra o limite normal. Também permite deixar mensagens ocultas em qualquer coisa escrita/desenhada: outros Druidas sempre reconhecem; não-Druidas precisam de um teste de Investigação CD 15 só para PERCEBER a mensagem (nunca decifrá-la sem magia).",
  },
  {
    id: "druida-ordem-primal-1",
    name: "Ordem Primal",
    sourceType: "class",
    classId: "druida",
    level: 1,
    autoGranted: false,
    summary:
      "Escolha permanente entre Protetor (proficiência em Armas Marciais + treinamento com Armadura Média, aplicadas diretamente nos campos de Proficiências/Armas e Armadura) e Xamã (+1 Truque de Druida, que aparece na área de Magias; bônus igual ao modificador de Sabedoria, mínimo +1, aplicado diretamente nos valores de Arcanismo e Natureza — nunca concede proficiência nessas perícias).",
    choices: [
      {
        id: ORDEM_PRIMAL_CHOICE_ID,
        prompt: "Ordem Primal: Protetor ou Xamã",
        effect: { kind: "optionPick", options: ["Protetor", "Xamã"] },
      },
      {
        id: XAMA_TRUQUE_CHOICE_ID,
        prompt: "Xamã — nome do Truque extra de Druida (só se Ordem Primal = Xamã)",
        effect: { kind: "manualText", placeholder: "Nome do Truque extra de Druida (só se escolher Xamã)" },
      },
    ],
  },
  {
    id: "druida-forma-selvagem-2",
    name: "Forma Selvagem",
    sourceType: "class",
    classId: "druida",
    level: 2,
    autoGranted: true,
    summary:
      "Recurso rastreável central do Druida (abreviado 'FS' no texto impresso). Ação Bônus: transforma-se numa Fera por até metade do nível de Druida em horas; termina se usar FS de novo, ficar Incapacitado, morrer, ou sair como Ação Bônus. A escolha de qual Fera assumir não faz parte da criação do personagem — sem catálogo de Feras no projeto (fonte 'AJUSTES NO PDF, FORMA SELVAGEM E EDIÇÃO DE PERÍCIAS' §2). Ao assumir a forma: PV Temp = nível de Druida. Mantém tipo de criatura, PV, Dados de Vida, INT/SAB/CAR, características de classe, idiomas, talentos e proficiências em perícias/Salvaguardas (usando o maior modificador entre o seu e o da Fera); as demais estatísticas vêm do bloco da Fera. Não pode conjurar magias em FS (Concentração em magia já ativa não é quebrada). Regra completa de equipamento (cair/fundir-se/ser usado pela forma/compatibilidade física) mantida no motor/Ficha Web, omitida do texto impresso por falta de espaço. Usos conforme o nível (rules/classResources.ts#getWildShapeUses — tabela já registrada, nunca inventada); +1 uso/Descanso Curto, todos/Descanso Longo.",
  },
  {
    id: "druida-companheiro-selvagem-2",
    name: "Companheiro Selvagem",
    sourceType: "class",
    classId: "druida",
    level: 2,
    autoGranted: true,
    summary:
      "Permite conjurar Convocar Familiar gastando 1 espaço de magia OU 1 uso de Forma Selvagem, sem componentes Materiais; o familiar é Feérico e desaparece após um Descanso Longo. Entra na área de Magias como opção especial (rules/druidAutoPreparedSpells.ts), não conta como magia preparada normal.",
  },
  {
    id: "druida-ressurgimento-selvagem-5",
    name: "Ressurgimento Selvagem",
    sourceType: "class",
    classId: "druida",
    level: 5,
    autoGranted: true,
    summary:
      "Atualiza Forma Selvagem — nunca cria um recurso ou bloco impresso novo. Regra 1: 1x por turno, se estiver com 0 usos de Forma Selvagem, pode gastar 1 espaço de magia para recuperar 1 uso de Forma Selvagem, sem gastar ação. Regra 2 (rastreável, com caixa própria que NÃO faz parte da quantidade de usos de Forma Selvagem): 1x/Descanso Longo, sem gastar ação, pode gastar 1 uso de Forma Selvagem para recuperar 1 espaço de 1º círculo.",
  },
  {
    id: "druida-furia-elemental-7",
    name: "Fúria Elemental",
    sourceType: "class",
    classId: "druida",
    level: 7,
    autoGranted: false,
    summary:
      "Escolha permanente entre Ataque Primal e Conjuração Poderosa. A mesma escolha também determina a versão aprimorada do nível 15 — nunca as duas opções ao mesmo tempo.",
    choices: [
      {
        id: FURIA_ELEMENTAL_CHOICE_ID,
        prompt: "Fúria Elemental: Ataque Primal ou Conjuração Poderosa",
        effect: { kind: "optionPick", options: ["Ataque Primal", "Conjuração Poderosa"] },
      },
    ],
  },
  {
    id: "druida-ataque-primal-7",
    name: "Ataque Primal",
    sourceType: "class",
    classId: "druida",
    level: 7,
    autoGranted: true,
    summary:
      "Se escolhido em Fúria Elemental: 1x em cada turno, ao acertar com um ataque com arma OU com um ataque da Fera durante Forma Selvagem, +1d8 de dano (tipo escolhido a cada acerto entre Elétrico/Gélido/Ígneo/Trovejante). A partir do nível 15, a MESMA característica (nunca um bloco separado — nunca 'Fúria Elemental Aprimorada'): o dado extra passa de 1d8 para 2d8.",
  },
  {
    id: "druida-conjuracao-poderosa-7",
    name: "Conjuração Poderosa",
    sourceType: "class",
    classId: "druida",
    level: 7,
    autoGranted: true,
    summary:
      "Se escolhida em Fúria Elemental: truques de Druida que causam dano recebem +modificador de Sabedoria no dano (aplicado diretamente na apresentação/cálculo do truque na área de Magias). A partir do nível 15, a MESMA característica (nunca um bloco separado): truques de Druida com alcance de 3m ou mais passam a ter alcance de 90m.",
  },
  {
    id: "druida-magias-bestiais-18",
    name: "Magias Bestiais",
    sourceType: "class",
    classId: "druida",
    level: 18,
    autoGranted: true,
    summary:
      "Atualiza Forma Selvagem — nunca um bloco separado. Em Forma Selvagem, agora pode conjurar magias, exceto as que tenham componente Material com custo especificado ou consumido.",
  },
  {
    id: "druida-arquidruida-20",
    name: "Arquidruida",
    sourceType: "class",
    classId: "druida",
    level: 20,
    autoGranted: true,
    summary:
      "Atualiza Forma Selvagem — nunca um grande bloco separado. Forma Selvagem Eterna: ao rolar Iniciativa com 0 usos de Forma Selvagem, recupera 1 uso. Natureza Xamânica: 1x/Descanso Longo, pode converter usos não gastos de Forma Selvagem em 1 único espaço de magia (círculo = 2 x usos de Forma Selvagem gastos nessa conversão; ex.: 2 usos -> espaço de 4º círculo), com caixa própria. Longevidade (regra completa mantida no domínio/Ficha Web, sem efeito prático recorrente durante o jogo — não impressa no PDF): a cada 10 anos que passam, o corpo do Druida envelhece apenas 1 ano.",
  },
];
