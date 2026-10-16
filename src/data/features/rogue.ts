import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Características da classe BASE do Ladino, estruturadas a partir da
 * fonte "IMPLEMENTAR LADINO E SUAS SUBCLASSES NO BUILDER E NO PDF" —
 * substitui as entradas genéricas que existiam antes em
 * `NAMED_FEATURES_BY_CLASS.ladino` (nome+nível pendente de conteúdo),
 * mesmo padrão já usado para Guerreiro/Patrulheiro
 * (`data/features/fighter.ts`/`ranger.ts`). As 4 SUBCLASSES
 * (`data/features/subclasses.ts` + `rules/rogueSubclassPrintedFeatures.ts`)
 * são desta MESMA fonte.
 *
 * "Golpe Astuto Aprimorado" (11) e "Golpes Sujos" (14) têm
 * `FeatureDefinition` própria (nomes reais da fonte), mas NUNCA criam
 * bloco impresso separado — só atualizam o bloco "Golpe Astuto" já
 * existente (rules/rogueClassPrintedFeatures.ts).
 *
 * Omitido de propósito do campo impresso (continua existindo como
 * `FeatureDefinition`, só não aparece em "Características de Classe"):
 * "Especialista" (nível 1/6) — a escolha de Especialização mora na
 * etapa própria "Perícias" e aparece lá, nunca como lembrete genérico
 * aqui; "Gíria dos Ladrões" — vai para o campo de Idiomas
 * (pdf/fieldMap.ts#getEffectiveLanguages), nunca como lembrete genérico
 * de "escolher idioma"; "Subclasse de Ladino" (estrutural, etapa Classe), "Aumento
 * no Valor de Atributo" e "Dádiva Épica" (sistema de Talentos/ASI
 * genérico, já cobre o Ladino via `ASI_LEVELS_BY_CLASS`/`DADIVA_EPICA_CLASSES`).
 */

export const ROGUE_EXPERTISE_CHOICE_ID_LEVEL_1 = "ladino-especialista-1-escolha";
export const ROGUE_EXPERTISE_CHOICE_ID_LEVEL_6 = "ladino-especialista-2-escolha";

export const rogueClassFeatures: FeatureDefinition[] = [
  {
    id: "ladino-ataque-furtivo-1",
    name: "Ataque Furtivo",
    sourceType: "class",
    classId: "ladino",
    level: 1,
    autoGranted: true,
    summary:
      "Uma vez por turno, ao acertar um ataque com arma de Acuidade ou à Distância, causa dano adicional do mesmo tipo da arma (rules/classResources.ts#getSneakAttackDice — progressão de 1d6 no nível 1-2 a 10d6 no nível 19-20). Exige Vantagem na jogada, OU que um aliado esteja a até 1,5m do alvo (sem estar Incapacitado) e o personagem não tenha Desvantagem na própria jogada — nunca concedido automaticamente a todos os ataques, nunca limitado ao próprio turno (também funciona em Ataques de Oportunidade e Reações).",
  },
  {
    id: "ladino-especialista-1",
    name: "Especialista",
    sourceType: "class",
    classId: "ladino",
    level: 1,
    autoGranted: false,
    summary:
      "Escolhe 2 perícias nas quais já é proficiente para ganhar Especialização (dobra o Bônus de Proficiência) — resolvido na etapa própria \"Perícias\" (domain/features.ts#FeatureChoiceEffect, variante `skillExpertise`), nunca uma Especialização duplicada numa perícia já especializada por outra escolha. Furtividade e Prestidigitação são só recomendações comuns, nunca escolhidas automaticamente.",
    choices: [
      {
        id: ROGUE_EXPERTISE_CHOICE_ID_LEVEL_1,
        prompt: "Especialista (nível 1) — escolha 2 perícias proficientes para Especialização",
        effect: { kind: "skillExpertise", count: 2 },
      },
    ],
  },
  {
    id: "ladino-giria-dos-ladroes-1",
    name: "Gíria dos Ladrões",
    sourceType: "class",
    classId: "ladino",
    level: 1,
    autoGranted: true,
    summary:
      "Aprende a Gíria dos Ladrões (concedida automaticamente — aparece no campo de Idiomas, pdf/fieldMap.ts#getEffectiveLanguages, mesmo padrão já usado para o Druídico do Druida) e pode escolher mais 1 idioma — sem catálogo estruturado de idiomas no projeto, o jogador digita a escolha diretamente no campo de texto livre de Idiomas, junto dos demais já concedidos.",
  },
  {
    id: "ladino-maestria-em-arma-1",
    name: "Maestria em Arma",
    sourceType: "class",
    classId: "ladino",
    level: 1,
    autoGranted: true,
    summary:
      "Pode usar a propriedade de Maestria de 2 tipos de arma Simples ou Marcial com os quais tenha proficiência (sempre 2, sem progressão por nível). Ao completar um Descanso Longo, pode trocar UMA das escolhas (nunca todas de uma vez). Decisão tomada DURANTE O JOGO — nunca uma exigência permanente na criação do personagem nem uma lista de armas fixada no PDF. Nunca concede proficiência em arma por si só nem amplia o catálogo de armas/propriedades (data/weapons.ts#WEAPON_MASTERIES).",
  },
  {
    id: "ladino-acao-ardilosa-2",
    name: "Ação Ardilosa",
    sourceType: "class",
    classId: "ladino",
    level: 2,
    autoGranted: true,
    summary: "No próprio turno, pode usar uma Ação Bônus para Correr, Desengajar ou Esconder.",
  },
  {
    id: "ladino-mira-firme-3",
    name: "Mira Firme",
    sourceType: "class",
    classId: "ladino",
    level: 3,
    autoGranted: true,
    summary:
      "Ação Bônus, só se ainda não tiver se movido neste turno: ganha Vantagem no próximo ataque realizado ainda neste turno, mas o deslocamento cai para 0 até o fim do turno. Nunca aplica a Vantagem ou o deslocamento 0 permanentemente — vale só para o turno em que foi usada.",
  },
  {
    id: "ladino-golpe-astuto-5",
    name: "Golpe Astuto",
    sourceType: "class",
    classId: "ladino",
    level: 5,
    autoGranted: true,
    summary:
      "Ao causar dano de Ataque Furtivo, pode retirar dados do dano de Ataque Furtivo ANTES da rolagem para aplicar um efeito extra (Envenenar 1d6, Retirada 1d6, Tropeço 1d6 — rules/rogueClassPrintedFeatures.ts), que ocorre imediatamente após o dano. Nunca é uma reserva de usos por descanso — o custo é sempre pago com os PRÓPRIOS dados do Ataque Furtivo daquele acerto, exigindo dados suficientes; nunca altera permanentemente o dano de Ataque Furtivo. As Salvaguardas desses efeitos usam CD própria (rules/classResources.ts#getRogueCunningStrikeCd = 8 + BP + mod DEX), calculada automaticamente. Pode combinar até 1 efeito por Ataque Furtivo neste nível (2 a partir do nível 11 — Golpe Astuto Aprimorado; rules/classResources.ts#getCunningStrikeMaxEffects).",
  },
  {
    id: "ladino-esquiva-sobrenatural-5",
    name: "Esquiva Sobrenatural",
    sourceType: "class",
    classId: "ladino",
    level: 5,
    autoGranted: true,
    summary:
      "Reação: quando um atacante à vista acerta um ataque contra o personagem, reduz o dano desse ataque à metade, arredondado para baixo. Nunca se torna uma Resistência permanente, nunca se aplica a dano sem jogada de ataque (ex.: a maioria das magias de dano).",
  },
  {
    id: "ladino-especialista-6",
    name: "Especialista",
    sourceType: "class",
    classId: "ladino",
    level: 6,
    autoGranted: false,
    summary:
      "Atualiza Especialista — escolhe mais 2 perícias nas quais já é proficiente para ganhar Especialização, resolvido na mesma etapa \"Perícias\", como uma escolha SEPARADA da de nível 1 (nunca a mesma, nunca reaplicada numa perícia que já tenha Especialização).",
    choices: [
      {
        id: ROGUE_EXPERTISE_CHOICE_ID_LEVEL_6,
        prompt: "Especialista (nível 6) — escolha mais 2 perícias proficientes para Especialização",
        effect: { kind: "skillExpertise", count: 2 },
      },
    ],
  },
  {
    id: "ladino-evasao-7",
    name: "Evasão",
    sourceType: "class",
    classId: "ladino",
    level: 7,
    autoGranted: true,
    summary:
      "Quando um efeito permitir uma Salvaguarda de Destreza para sofrer metade do dano, um sucesso não causa dano nenhum, e uma falha causa só metade — nunca se aplica indiscriminadamente a qualquer Salvaguarda de Destreza, e fica indisponível enquanto o personagem estiver Incapacitado.",
  },
  {
    id: "ladino-talento-confiavel-7",
    name: "Talento Confiável",
    sourceType: "class",
    classId: "ladino",
    level: 7,
    autoGranted: true,
    summary:
      "Em qualquer teste de atributo que já some o Bônus de Proficiência por uma perícia ou ferramenta proficiente, pode tratar um resultado de 1 a 9 no d20 como 10. Nunca altera bônus permanentes, nunca se aplica a jogadas de ataque ou Salvaguardas.",
  },
  {
    id: "ladino-golpe-astuto-aprimorado-11",
    name: "Golpe Astuto Aprimorado",
    sourceType: "class",
    classId: "ladino",
    level: 11,
    autoGranted: true,
    summary:
      "Atualiza Golpe Astuto — nunca um bloco impresso separado. Passa a poder combinar até 2 efeitos no mesmo Ataque Furtivo, pagando o custo de ambos com os dados do próprio Ataque Furtivo (rules/classResources.ts#getCunningStrikeMaxEffects).",
  },
  {
    id: "ladino-golpes-sujos-14",
    name: "Golpes Sujos",
    sourceType: "class",
    classId: "ladino",
    level: 14,
    autoGranted: true,
    summary:
      "Atualiza Golpe Astuto — nunca um bloco impresso separado. Acrescenta 3 novas opções ao mesmo conjunto de efeitos: Aturdir 2d6 (Salvaguarda de Constituição; falha: no próximo turno do alvo, ele só pode se mover, executar uma ação OU uma Ação Bônus — nunca a condição Atordoado, nunca as 3 opções de restrição ao mesmo tempo), Nocaute 6d6 (Salvaguarda de Constituição; falha: Inconsciente por 1 minuto, encerra ao sofrer qualquer dano, repete a Salvaguarda ao fim de cada turno do alvo) e Obscurecer 3d6 (Salvaguarda de Destreza; falha: Cego até o fim do próximo turno do alvo).",
  },
  {
    id: "ladino-mente-escorregadia-15",
    name: "Mente Escorregadia",
    sourceType: "class",
    classId: "ladino",
    level: 15,
    autoGranted: true,
    summary:
      "Concede proficiência em Salvaguarda de Sabedoria e de Carisma (rules/savingThrows.ts#getSlipperyMindGrantedAbilities), aplicada direto nos campos de Salvaguarda — preserva qualquer proficiência já concedida por outra origem, nunca inventa compensação quando uma das duas já é proficiente. Nunca impressa em Características de Classe.",
  },
  {
    id: "ladino-elusivo-18",
    name: "Elusivo",
    sourceType: "class",
    classId: "ladino",
    level: 18,
    autoGranted: true,
    summary: "Ataques contra o personagem nunca podem ter Vantagem, salvo se ele estiver Incapacitado.",
  },
  {
    id: "ladino-golpe-de-sorte-20",
    name: "Golpe de Sorte",
    sourceType: "class",
    classId: "ladino",
    level: 20,
    autoGranted: true,
    summary:
      "Após falhar em um teste de atributo, jogada de ataque ou Salvaguarda (um Teste de D20), pode transformar o resultado da rolagem em 20 — nunca uma nova rolagem. Um uso por Descanso Curto ou Longo. As consequências de um resultado 20 (acerto crítico, etc.) seguem as regras já existentes, sem nenhuma invenção adicional.",
  },
];
