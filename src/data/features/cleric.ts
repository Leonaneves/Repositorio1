import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Características de CLASSE do Clérigo, estruturadas a partir da fonte
 * "INTEGRAÇÃO COMPLETA — CLÉRIGO E SUBCLASSES" — substitui as entradas
 * genéricas que existiam antes em `NAMED_FEATURES_BY_CLASS.clerigo`
 * (nome+nível pendente de conteúdo).
 *
 * Mesma `FeatureDefinition` por característica mesmo quando ela evolui
 * em nível posterior (Centelha Divina nos níveis 7/13/18, Golpes
 * Abençoados no 14, Intervenção Divina no 20) — a evolução fica no
 * texto impresso dinâmico (`rules/clericPrintedFeatures.ts`), nunca
 * numa segunda `FeatureDefinition`. "Fulminar Mortos-Vivos" é a única
 * exceção explícita da fonte: tem `FeatureDefinition` própria (nome
 * real da característica, nível 5), mas NUNCA cria um bloco impresso
 * separado — só atualiza o texto de "Expulsar Mortos-Vivos".
 *
 * Omitidas de propósito do campo impresso (continuam existindo como
 * `FeatureDefinition`, só não aparecem em "Características de
 * Classe" — ver `rules/clericPrintedFeatures.ts`): "Conjuração",
 * "Ordem Divina" (resolvida em Perícias/Proficiências/Magias, nunca
 * precisa ocupar este campo), "Subclasse de Clérigo" (estrutural,
 * etapa 3 do Builder), "Aumento no Valor de Atributo" e "Dádiva
 * Épica" (sistema de Talentos/ASI genérico, já cobre o Clérigo via
 * `ASI_LEVELS_BY_CLASS`/`DADIVA_EPICA_CLASSES`).
 */

export const ORDEM_DIVINA_CHOICE_ID = "clerigo-ordem-divina-escolha";
export const TAUMATURGO_TRUQUE_CHOICE_ID = "clerigo-taumaturgo-truque-escolha";
export const GOLPES_ABENCOADOS_CHOICE_ID = "clerigo-golpes-abencoados-escolha";

export const clericClassFeatures: FeatureDefinition[] = [
  {
    id: "clerigo-conjuracao-1",
    name: "Conjuração",
    sourceType: "class",
    classId: "clerigo",
    level: 1,
    autoGranted: true,
    summary:
      "Conjuração completa (atributo Sabedoria, foco Símbolo Sagrado). Prepara magias da lista de Clérigo — quantidade de Truques/Magias Preparadas conforme o nível (rules/classResources.ts#getCantripsKnown/#getSpellsPreparedMax); as magias escolhidas precisam ser de círculos para os quais há espaço de magia disponível. Após um Descanso Longo, pode redefinir toda a lista de Magias Preparadas. Magias sempre preparadas por outra característica (ex.: Magias de Domínio) não contam contra o limite normal, mas contam como magias de Clérigo. Truques/Magias Preparadas/Espaços/CD/Ataque de magia/magias sempre preparadas ficam todos na área de Magias, nunca neste campo.",
  },
  {
    id: "clerigo-ordem-divina-1",
    name: "Ordem Divina",
    sourceType: "class",
    classId: "clerigo",
    level: 1,
    autoGranted: false,
    summary:
      "Escolha permanente entre Protetor (proficiência em Armas Marciais + treinamento com Armadura Pesada, aplicadas diretamente nos campos de Proficiências/Armas e Armadura) e Taumaturgo (+1 Truque de Clérigo, que aparece na área de Magias; bônus igual ao modificador de Sabedoria, mínimo +1, aplicado diretamente nos valores de Arcanismo e Religião — nunca concede proficiência nessas perícias).",
    choices: [
      {
        id: ORDEM_DIVINA_CHOICE_ID,
        prompt: "Ordem Divina: Protetor ou Taumaturgo",
        effect: { kind: "optionPick", options: ["Protetor", "Taumaturgo"] },
      },
      {
        id: TAUMATURGO_TRUQUE_CHOICE_ID,
        prompt: "Taumaturgo — nome do Truque extra de Clérigo (só se Ordem Divina = Taumaturgo)",
        effect: { kind: "manualText", placeholder: "Nome do Truque extra de Clérigo (só se escolher Taumaturgo)" },
      },
    ],
  },
  {
    id: "clerigo-canalizar-divindade-2",
    name: "Canalizar Divindade",
    sourceType: "class",
    classId: "clerigo",
    level: 2,
    autoGranted: true,
    summary:
      "Recurso ÚNICO, compartilhado por todas as opções de Canalizar Divindade do Clérigo (Centelha Divina, Expulsar Mortos-Vivos) e da subclasse escolhida — nunca um conjunto de usos separado por opção. Quantidade de usos conforme o nível (rules/classResources.ts#getChannelDivinityUses); recupera +1 uso após Descanso Curto, todos após Descanso Longo. Qualquer CD exigida por um efeito de Canalizar Divindade é a CD de magia do Clérigo (já exibida na área de Magias).",
  },
  {
    id: "clerigo-centelha-divina-2",
    name: "Centelha Divina",
    sourceType: "class",
    classId: "clerigo",
    level: 2,
    autoGranted: true,
    summary:
      "Opção de Canalizar Divindade (Ação: Usar Magia). Alvo: 1 criatura visível a 9m. Role os dados de Centelha (progressão por nível — 2º-6º: 1d8; 7º-12º: 2d8; 13º-17º: 3d8; 18º-20º: 4d8) + modificador de Sabedoria; escolha curar PV iguais ao total OU forçar uma Salvaguarda de Constituição — falha: dano igual ao total, sucesso: metade do dano — tipo Necrótico ou Radiante, escolhido no momento (nunca uma decisão permanente do Builder).",
  },
  {
    id: "clerigo-expulsar-mortos-vivos-2",
    name: "Expulsar Mortos-Vivos",
    sourceType: "class",
    classId: "clerigo",
    level: 2,
    autoGranted: true,
    summary:
      "Opção de Canalizar Divindade (Ação: Usar Magia). Mortos-Vivos visíveis a 9m fazem uma Salvaguarda de Sabedoria; falha: ficam Amedrontados e Incapacitados por 1 minuto, tentando se afastar o máximo possível de você durante esse tempo; o efeito termina antes se o Morto-Vivo sofrer dano, você ficar Incapacitado, ou você morrer.",
  },
  {
    id: "clerigo-fulminar-mortos-vivos-5",
    name: "Fulminar Mortos-Vivos",
    sourceType: "class",
    classId: "clerigo",
    level: 5,
    autoGranted: true,
    summary:
      "Atualiza Expulsar Mortos-Vivos — nunca cria um recurso ou bloco impresso novo. Quando um Morto-Vivo falha a Salvaguarda de Expulsar Mortos-Vivos, ele também sofre dano Radiante igual ao modificador de Sabedoria em d8 (mínimo 1d8); este dano NÃO encerra o efeito de Expulsar Mortos-Vivos.",
  },
  {
    id: "clerigo-golpes-abencoados-7",
    name: "Golpes Abençoados",
    sourceType: "class",
    classId: "clerigo",
    level: 7,
    autoGranted: false,
    summary:
      "Escolha permanente entre Conjuração Poderosa e Golpe Divino. A mesma escolha também determina qual bloco é atualizado no nível 14 — nunca as duas opções ao mesmo tempo.",
    choices: [
      {
        id: GOLPES_ABENCOADOS_CHOICE_ID,
        prompt: "Golpes Abençoados: Conjuração Poderosa ou Golpe Divino",
        effect: { kind: "optionPick", options: ["Conjuração Poderosa", "Golpe Divino"] },
      },
    ],
  },
  {
    id: "clerigo-conjuracao-poderosa-7",
    name: "Conjuração Poderosa",
    sourceType: "class",
    classId: "clerigo",
    level: 7,
    autoGranted: true,
    summary:
      "Se escolhida em Golpes Abençoados: truques de Clérigo que causam dano recebem +modificador de Sabedoria no dano (aplicado diretamente na apresentação/cálculo do truque na área de Magias). A partir do nível 14, a MESMA característica (nunca um bloco separado) também concede: ao causar dano com um truque de Clérigo, você ou uma criatura a até 18m ganha PV Temporários iguais a 2x o modificador de Sabedoria.",
  },
  {
    id: "clerigo-golpe-divino-7",
    name: "Golpe Divino",
    sourceType: "class",
    classId: "clerigo",
    level: 7,
    autoGranted: true,
    summary:
      "Se escolhido em Golpes Abençoados: 1x/turno, ao acertar uma criatura com um ataque com arma, +1d8 de dano Necrótico ou Radiante, escolhido no momento. A partir do nível 14, a MESMA característica (nunca um bloco separado): o dado extra passa de 1d8 para 2d8.",
  },
  {
    id: "clerigo-intervencao-divina-10",
    name: "Intervenção Divina",
    sourceType: "class",
    classId: "clerigo",
    level: 10,
    autoGranted: true,
    summary:
      "1x/Descanso Longo. Ação: Usar Magia; escolha qualquer magia de Clérigo de até 5º círculo que não tenha tempo de conjuração Reação e conjure-a como parte desta ação, sem gastar espaço de magia e sem componentes Materiais. A magia é escolhida no momento do uso — nunca uma seleção permanente do Builder.",
  },
  {
    id: "clerigo-intervencao-divina-maior-20",
    name: "Intervenção Divina Maior",
    sourceType: "class",
    classId: "clerigo",
    level: 20,
    autoGranted: true,
    summary:
      "Atualiza Intervenção Divina — nunca um bloco separado. Ao usar Intervenção Divina, pode escolher conjurar também Desejo; se o fizer, Intervenção Divina só pode ser usada novamente após 2d4 Descansos Longos. Desejo nunca entra permanentemente na lista de Magias Preparadas — é uma opção situacional exclusiva desta característica.",
  },
];
