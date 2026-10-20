import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Catálogo dos Talentos do PHB 2024, em DOIS lotes:
 *
 * 1. Os 10 Talentos de Origem (fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO
 *    BUILDER E NO PDF") — Alerta, Artifista, Atacante Selvagem,
 *    Curandeiro, Habilidoso, Iniciado em Magia, Músico, Sortudo, Valentão
 *    de Taverna, Vigoroso. Nunca aumentam atributo nem têm pré-requisito.
 * 2. Os 42 Talentos Gerais (26 da fonte "COMPLETAR TALENTOS GERAIS NO
 *    BUILDER E NO PDF" + 16 da fonte "IMPLEMENTAR TALENTOS GERAIS
 *    RESTANTES NO BUILDER E NO PDF") — só disponíveis em nível de ASI (nunca
 *    concedidos por Antecedente — nenhum dos 16 Antecedentes do projeto
 *    concede um destes), todos exigindo nível de personagem 4+ e concedendo
 *    exatamente 1 escolha de "Aumento de 1 num atributo" (`abilityScoreIncrease`,
 *    `domain/features.ts`), além de alguns exigirem outro pré-requisito
 *    (treinamento com um tipo de armadura, um atributo mínimo 13, ou a
 *    característica Conjuração/Magia de Pacto) — ver
 *    `rules/feats.ts#GENERAL_FEAT_PREREQUISITES`. Só Adepto Elemental é
 *    repetível.
 *
 * Estas são as entradas-BASE do catálogo — cada uma representa "o
 * talento em si", nunca uma aquisição específica. Uma aquisição real
 * (pelo Antecedente OU por uma escolha de ASI) é construída por
 * `rules/feats.ts#instantiateFeatAcquisition`, que copia esta entrada e
 * PARAMETRIZA o id de cada `FeatureChoice` interna com uma chave de
 * aquisição (`background` ou `asi-{nível}`) — nunca usa os ids
 * declarados aqui diretamente em `character.featureChoiceSelections`,
 * exceto quando só pode existir UMA aquisição ativa por vez (o próprio
 * mecanismo de `asiSelections`/antecedente já impede isso para todos os
 * talentos não-repetíveis, mas a parametrização é uniforme por todos,
 * nunca um caso especial por talento).
 *
 * Só Habilidoso, Iniciado em Magia e Adepto Elemental são repetíveis (`repeatable: true`)
 * — todos os demais só podem estar ativos em UMA aquisição por vez
 * (`rules/feats.ts#getAvailableFeatsForAsiLevel` exclui um talento
 * não-repetível já ativo em outra aquisição, incluindo a do
 * Antecedente).
 */

export const ALERTA_FEAT_ID = "alerta";
export const ARTIFISTA_FEAT_ID = "artifista";
export const ATACANTE_SELVAGEM_FEAT_ID = "atacante-selvagem";
export const CURANDEIRO_FEAT_ID = "curandeiro";
export const HABILIDOSO_FEAT_ID = "habilidoso";
export const INICIADO_EM_MAGIA_FEAT_ID = "iniciado-em-magia";
export const MUSICO_FEAT_ID = "musico";
export const SORTUDO_FEAT_ID = "sortudo";
export const VALENTAO_DE_TAVERNA_FEAT_ID = "valentao-de-taverna";
export const VIGOROSO_FEAT_ID = "vigoroso";

/**
 * Ids dos 10 Talentos de Origem, nesta ordem fixa — usado para filtrar
 * `generalFeats` pela categoria "Origem" (fonte "ADICIONAR ESCOLHA DE
 * TALENTO DE ORIGEM DO HUMANO NA ETAPA ESPÉCIE" §1: "Permitir escolher
 * exatamente um talento do catálogo existente, filtrado pela categoria
 * Origem"). Nunca inclui nenhum dos Talentos Gerais abaixo — aqueles
 * só ficam disponíveis via ASI (`rules/feats.ts#getAvailableFeatsForAsiLevel`).
 */
export const ORIGIN_FEAT_IDS = [
  ALERTA_FEAT_ID,
  ARTIFISTA_FEAT_ID,
  ATACANTE_SELVAGEM_FEAT_ID,
  CURANDEIRO_FEAT_ID,
  HABILIDOSO_FEAT_ID,
  INICIADO_EM_MAGIA_FEAT_ID,
  MUSICO_FEAT_ID,
  SORTUDO_FEAT_ID,
  VALENTAO_DE_TAVERNA_FEAT_ID,
  VIGOROSO_FEAT_ID,
] as const;

/** Ids-BASE das `FeatureChoice` de cada talento — sempre parametrizados por `rules/feats.ts#instantiateFeatAcquisition`, nunca usados diretamente. */
export const ARTIFISTA_TOOL_CHOICE_BASE_IDS = ["artifista-ferramenta-1", "artifista-ferramenta-2", "artifista-ferramenta-3"] as const;
export const HABILIDOSO_CHOICE_BASE_ID = "habilidoso-escolha";
export const MAGIC_INITIATE_LIST_CHOICE_BASE_ID = "iniciado-em-magia-lista";
export const MAGIC_INITIATE_CANTRIP_1_CHOICE_BASE_ID = "iniciado-em-magia-truque-1";
export const MAGIC_INITIATE_CANTRIP_2_CHOICE_BASE_ID = "iniciado-em-magia-truque-2";
export const MAGIC_INITIATE_SPELL_CHOICE_BASE_ID = "iniciado-em-magia-magia-1-circulo";
export const MAGIC_INITIATE_ABILITY_CHOICE_BASE_ID = "iniciado-em-magia-atributo";
export const MUSICO_TOOL_CHOICE_BASE_ID = "musico-instrumento";

export const MAGIC_INITIATE_LISTS = ["Clérigo", "Druida", "Mago"] as const;
export const MAGIC_INITIATE_ABILITIES = ["Inteligência", "Sabedoria", "Carisma"] as const;

/**
 * Ids-BASE dos 26 Talentos Gerais (fonte "COMPLETAR TALENTOS GERAIS NO
 * BUILDER E NO PDF") — nomes exatos da fonte, em kebab-case sem acento
 * (convenção do projeto para ids, igual às demais listas de catálogo).
 * "Mente Aguçada" vira `mente-agucada` (ç→c, mesma convenção de
 * `SKILL_KEYS`/`BACKGROUND_IDS` em `domain/ids.ts`, nenhum dos quais usa
 * acento).
 */
export const ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID = "especialista-armaduras-pesadas";
export const ESPECIALISTA_BESTA_FEAT_ID = "especialista-besta";
export const ESPECIALISTA_PERICIA_FEAT_ID = "especialista-pericia";
export const EXTERMINADOR_DE_CONJURADORES_FEAT_ID = "exterminador-de-conjuradores";
export const IMOBILIZADOR_FEAT_ID = "imobilizador";
export const LIDER_INSPIRADOR_FEAT_ID = "lider-inspirador";
export const MENTE_AGUCADA_FEAT_ID = "mente-agucada";
export const MESTRE_DAS_ARMAS_FEAT_ID = "mestre-das-armas";
export const MESTRE_EM_ARMADURAS_MEDIAS_FEAT_ID = "mestre-em-armaduras-medias";
export const MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID = "mestre-em-armaduras-pesadas";
export const MESTRE_EM_ARMAS_DE_HASTE_FEAT_ID = "mestre-em-armas-de-haste";
export const MESTRE_EM_ARMAS_GRANDES_FEAT_ID = "mestre-em-armas-grandes";
export const MESTRE_EM_ESCUDOS_FEAT_ID = "mestre-em-escudos";
export const MESTRE_ATIRADOR_FEAT_ID = "mestre-atirador";
export const PERFURADOR_FEAT_ID = "perfurador";
export const RESILIENTE_FEAT_ID = "resiliente";
export const RESISTENTE_FEAT_ID = "resistente";
export const SENTINELA_FEAT_ID = "sentinela";
export const SORRATEIRO_FEAT_ID = "sorrateiro";
export const TALHADOR_FEAT_ID = "talhador";
export const TELECINETICO_FEAT_ID = "telecinetico";
export const TELEPATICO_FEAT_ID = "telepatico";
export const TOCADO_PELAS_SOMBRAS_FEAT_ID = "tocado-pelas-sombras";
export const TOCADO_POR_FADAS_FEAT_ID = "tocado-por-fadas";
export const TREINAMENTO_COM_ARMAS_MARCIAIS_FEAT_ID = "treinamento-com-armas-marciais";
export const VELOCISTA_FEAT_ID = "velocista";

/**
 * Lote "IMPLEMENTAR TALENTOS GERAIS RESTANTES NO BUILDER E NO PDF" (de
 * Adepto Elemental a Especialista em Armaduras Médias). Atirador Arcano
 * e Conjurador Bélico mantêm os ids com que foram cadastrados primeiro
 * (`atirador-de-magias`, `conjurador-de-guerra`) — personagens já
 * salvos continuam válidos. Pré-requisitos em
 * `rules/feats.ts#GENERAL_FEAT_PREREQUISITES`; Adepto Elemental é
 * repetível, com um tipo de dano diferente a cada aquisição
 * (`rules/feats.ts#buildFeatAcquisitionFeature`).
 */
export const ADEPTO_ELEMENTAL_FEAT_ID = "adepto-elemental";
export const AGRESSOR_FEAT_ID = "agressor";
export const AMBIDESTRO_FEAT_ID = "ambidestro";
export const ANALITICO_FEAT_ID = "analitico";
export const ATIRADOR_ARCANO_FEAT_ID = "atirador-de-magias";
export const ATLETA_FEAT_ID = "atleta";
export const ATOR_FEAT_ID = "ator";
export const CHEF_FEAT_ID = "chef";
export const COMBATENTE_MONTADO_FEAT_ID = "combatente-montado";
export const CONJURADOR_BELICO_FEAT_ID = "conjurador-de-guerra";
export const CONJURADOR_RITUALISTA_FEAT_ID = "conjurador-ritualista";
export const DUELISTA_DEFENSIVO_FEAT_ID = "duelista-defensivo";
export const ENVENENADOR_FEAT_ID = "envenenador";
export const ESMAGADOR_FEAT_ID = "esmagador";
export const ESPECIALISTA_ARMADURAS_LEVES_FEAT_ID = "especialista-armaduras-leves";
export const ESPECIALISTA_ARMADURAS_MEDIAS_FEAT_ID = "especialista-armaduras-medias";

export const ADEPTO_ELEMENTAL_DAMAGE_CHOICE_BASE_ID = "adepto-elemental-tipo-de-dano";
export const ADEPTO_ELEMENTAL_DAMAGE_TYPES = ["Ácido", "Elétrico", "Frio", "Fogo", "Trovão"] as const;
export const ANALITICO_SKILL_CHOICE_ID = "analitico-pericia";
export const ANALITICO_SKILL_OPTIONS = ["intuicao", "investigacao", "percepcao"] as const;
/**
 * Conjurador Ritualista: uma escolha de magia por ponto de Bônus de
 * Proficiência — o catálogo declara o máximo (BP 6, nível 17+) e
 * `rules/feats.ts#buildFeatAcquisitionFeature` mostra só as BP primeiras
 * do nível atual (uma nova escolha aparece sempre que o BP aumenta).
 */
export const CONJURADOR_RITUALISTA_SPELL_CHOICE_BASE_IDS = [1, 2, 3, 4, 5, 6].map((index) => `conjurador-ritualista-magia-${index}`);

/** Ids-BASE das `FeatureChoice` que não seguem a convenção genérica `${featId}-atributo` (ver `rules/feats.ts#getFeatAbilityIncreaseChoiceId`) — escolhas de perícia/magia/nota própria de um talento específico. */
export const ESPECIALISTA_PERICIA_SKILL_CHOICE_ID = "especialista-pericia-pericia";
export const ESPECIALISTA_PERICIA_EXPERTISE_CHOICE_ID = "especialista-pericia-especializacao";
export const MENTE_AGUCADA_SKILL_CHOICE_ID = "mente-agucada-pericia";
export const MENTE_AGUCADA_SKILL_OPTIONS = ["arcanismo", "historia", "investigacao", "natureza", "religiao"] as const;
export const MESTRE_DAS_ARMAS_NOTE_CHOICE_ID = "mestre-das-armas-nota";
export const TOCADO_PELAS_SOMBRAS_SPELL_CHOICE_ID = "tocado-pelas-sombras-magia";
export const TOCADO_POR_FADAS_SPELL_CHOICE_ID = "tocado-por-fadas-magia";

export const generalFeats: FeatureDefinition[] = [
  {
    id: ALERTA_FEAT_ID,
    name: "Alerta",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nunca repetível. Proficiência em Iniciativa: ao jogar Iniciativa, soma o Bônus de Proficiência (rules/derived.ts#getInitiative) — nunca duplicado por outra fonte que não autorize essa soma. Troca de Iniciativa: imediatamente após jogar Iniciativa, pode trocar o resultado com um aliado voluntário no mesmo combate; nenhum dos dois pode estar Incapacitado — decisão tomada durante o jogo, nunca uma escolha permanente no Builder.",
  },
  {
    id: ARTIFISTA_FEAT_ID,
    name: "Artifista",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nunca repetível. Proficiência com 3 Ferramentas de Artesão diferentes, restritas à tabela \"Fabricação Rápida\" (catálogo ainda PENDENTE no projeto — as 3 escolhas ficam como entrada manual claramente marcada, nunca ampliadas para todo o catálogo de Ferramentas de Artesão sem conferir essa tabela). Desconto de 20% na compra de itens não mágicos — sem sistema de compras no projeto hoje, por isso sem efeito automático algum a aplicar; nunca altera o preço-base do catálogo nem desconta item mágico. Fabricação Rápida: ao completar Descanso Longo, pode fabricar 1 peça de equipamento da tabela (exige possuir e ter proficiência com as ferramentas associadas); o item dura até completar outro Descanso Longo, quando se desfaz — item escolhido durante o jogo, nunca uma seleção permanente no Builder nem concedido automaticamente.",
    choices: ARTIFISTA_TOOL_CHOICE_BASE_IDS.map((id, index) => ({
      id,
      prompt: `Artifista — Ferramenta de Artesão ${index + 1}/3 (tabela Fabricação Rápida — catálogo pendente, entrada manual)`,
      effect: { kind: "manualText", placeholder: "Nome da Ferramenta de Artesão (tabela Fabricação Rápida)" },
    })),
  },
  {
    id: ATACANTE_SELVAGEM_FEAT_ID,
    name: "Atacante Selvagem",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nunca repetível. Uma vez por turno (não limitado ao próprio turno), ao acertar um alvo com arma, pode jogar os dados de dano da arma duas vezes e escolher um dos resultados — nunca soma as duas rolagens, nunca escolhe o melhor de cada dado separadamente. Aplica-se só aos dados de dano DA ARMA, nunca a dados adicionais de outra característica (Ataque Furtivo, Destruição Divina etc.). Sem recurso por descanso — é um benefício de uso livre, 1×/turno.",
  },
  {
    id: CURANDEIRO_FEAT_ID,
    name: "Curandeiro",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nunca repetível. Médico de Combate: Ação de Usar Objeto, gastando 1 uso do Kit de Curandeiro, para cuidar de uma criatura a até 1,5m — a criatura gasta 1 dos próprios Dados de Vida, mas quem tem o talento é quem JOGA esse dado; a criatura recupera o resultado + o Bônus de Proficiência de quem usou o talento (nunca o Dado de Vida do curandeiro quando o alvo é outra criatura, nunca soma CON). O custo é o uso do kit + o Dado de Vida da criatura — nunca uma reserva própria do talento. Cura Garantida: ao rolar dado para PV recuperados por magia OU por Médico de Combate, pode repetir UM resultado 1, usando obrigatoriamente o novo resultado (nunca repete de novo se o novo também for 1; nunca se aplica a PV Temp ou outras fontes de cura).",
  },
  {
    id: HABILIDOSO_FEAT_ID,
    name: "Habilidoso",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "REPETÍVEL — cada aquisição concede mais 3 escolhas independentes, com identidade e seleção própria (nunca uma reserva compartilhada entre aquisições diferentes). Qualquer combinação de 3 perícias e/ou ferramentas/instrumentos (ex.: 2 perícias + 1 ferramenta) concede proficiência nas escolhidas — nunca exige 3 de cada, nunca concede Especialização, nunca permite escolher a mesma proficiência duas vezes para um benefício inexistente. As 3 escolhas desta aquisição compartilham um ÚNICO limite (domain/features.ts#FeatureChoiceEffect, variante `skillOrToolProficiency`) — nunca duas contagens independentes.",
    choices: [
      {
        id: HABILIDOSO_CHOICE_BASE_ID,
        prompt: "Habilidoso — escolha 3: qualquer combinação de perícias e/ou ferramentas/instrumentos",
        effect: { kind: "skillOrToolProficiency", toolCategory: ["artisanTool", "musicalInstrument", "thievesTools"], count: 3 },
      },
    ],
  },
  {
    id: INICIADO_EM_MAGIA_FEAT_ID,
    name: "Iniciado em Magia",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "REPETÍVEL, mas cada aquisição deve usar uma lista diferente (Clérigo, Druida ou Mago) — no máximo 3 aquisições válidas com as 3 listas fornecidas; cada uma mantém lista, atributo, magias e 1 uso gratuito por Descanso Longo PRÓPRIOS, nunca fundidos numa reserva genérica. Escolhas desta aquisição: a lista; 2 truques diferentes dessa lista (aprendidos); 1 magia de 1º círculo da mesma lista (sempre preparada, fora do limite normal de Magias Preparadas); o atributo de conjuração desta aquisição (Inteligência, Sabedoria ou Carisma — escolha INDEPENDENTE da lista, nunca obriga INT para Mago nem SAB para Clérigo/Druida, nunca exige pertencer à classe escolhida, nunca altera o atributo de conjuração da classe). A magia de 1º círculo pode ser conjurada 1×/Descanso Longo sem gastar espaço, ou normalmente usando espaços de magia disponíveis — esta aquisição NUNCA concede espaços de magia por si só. Ao ganhar um nível de personagem, pode substituir uma das magias escolhidas (incluindo um truque) por outra da mesma lista e do mesmo círculo — os campos de texto permanecem sempre editáveis, nunca travados após a escolha inicial. Sem catálogo de magias no projeto: truques e magia são entrada manual, nunca validados como escolha confirmada.",
    choices: [
      {
        id: MAGIC_INITIATE_LIST_CHOICE_BASE_ID,
        prompt: "Iniciado em Magia — lista de magias (Clérigo, Druida ou Mago)",
        effect: { kind: "optionPick", options: [...MAGIC_INITIATE_LISTS] },
      },
      {
        id: MAGIC_INITIATE_CANTRIP_1_CHOICE_BASE_ID,
        prompt: "Iniciado em Magia — 1º truque (catálogo de magias pendente — entrada manual)",
        effect: { kind: "manualText", placeholder: "Nome do 1º truque" },
      },
      {
        id: MAGIC_INITIATE_CANTRIP_2_CHOICE_BASE_ID,
        prompt: "Iniciado em Magia — 2º truque (catálogo de magias pendente — entrada manual)",
        effect: { kind: "manualText", placeholder: "Nome do 2º truque" },
      },
      {
        id: MAGIC_INITIATE_SPELL_CHOICE_BASE_ID,
        prompt: "Iniciado em Magia — magia de 1º círculo (catálogo de magias pendente — entrada manual)",
        effect: { kind: "manualText", placeholder: "Nome da magia de 1º círculo" },
      },
      {
        id: MAGIC_INITIATE_ABILITY_CHOICE_BASE_ID,
        prompt: "Iniciado em Magia — atributo de conjuração desta aquisição (Inteligência, Sabedoria ou Carisma)",
        effect: { kind: "optionPick", options: [...MAGIC_INITIATE_ABILITIES] },
      },
    ],
  },
  {
    id: MUSICO_FEAT_ID,
    name: "Músico",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nunca repetível. Proficiência com 3 Instrumentos Musicais diferentes (nunca concede os itens físicos). Canção Encorajadora: ao completar Descanso Curto ou Longo, pode tocar um instrumento com o qual tenha proficiência e conceder Inspiração Heroica a até o Bônus de Proficiência de aliados que ouçam — alvos escolhidos durante o jogo, nunca um marcador por aliado nem uma reserva de usos do Bônus de Proficiência; preserva o funcionamento normal de Inspiração Heroica, sem acúmulo adicional.",
    choices: [
      {
        id: MUSICO_TOOL_CHOICE_BASE_ID,
        prompt: "Músico — escolha 3 Instrumentos Musicais",
        effect: { kind: "toolProficiency", category: "musicalInstrument", count: 3 },
      },
    ],
  },
  {
    id: SORTUDO_FEAT_ID,
    name: "Sortudo",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nunca repetível. Reserva de Pontos de Sorte igual ao Bônus de Proficiência (rules/feats.ts#getLuckyPointsMax), recupera por completo em Descanso Longo. Cada ponto gasto concede Vantagem num teste de d20 (Teste de Atributo, Salvaguarda ou Ataque) que você fizer, OU impõe Desvantagem a um ataque de d20 feito CONTRA você — os dois benefícios compartilham a MESMA reserva, nunca duas separadas. Nunca exige Reação. Nunca vira uma repetição genérica de rolagem após saber o resultado, nunca altera dano.",
    uses: { formula: { kind: "proficiencyBonus" }, recharge: "descansoLongo" },
  },
  {
    id: VALENTAO_DE_TAVERNA_FEAT_ID,
    name: "Valentão de Taverna",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nunca repetível. Ataque Desarmado Aprimorado: ao acertar e causar dano com Ataque Desarmado, pode OPCIONALMENTE usar 1d4 + mod FOR de dano Contundente no lugar do dano normal — nunca sobrescreve uma opção melhor de outra característica (preserva Artes Marciais do Monge: usa o maior dado entre os dois, rules/feats.ts#getUnarmedStrikeDamageDie). Dano Garantido: ao jogar o dado de dano do Ataque Desarmado, pode repetir um resultado 1, usando obrigatoriamente o novo resultado (nunca repete de novo se o novo também for 1; aplica-se ao dado de dano usado, não só ao d4 deste talento). Armamento Improvisado: proficiência com armas improvisadas. Empurrar: uma vez por turno, ao acertar um Ataque Desarmado como parte da ação Atacar no próprio turno, pode causar dano e empurrar o alvo 1,5m para longe — nunca substitui o dano pelo empurrão, nunca exige Salvaguarda/teste/Ação Bônus/custo adicional, nunca ativa fora da ação Atacar (ex.: um Ataque Desarmado de Torrente de Golpes).",
  },
  {
    id: VIGOROSO_FEAT_ID,
    name: "Vigoroso",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nunca repetível. Aumenta os PV máximos em 2 × nível total do personagem (rules/feats.ts#getToughHpBonus, somado em rules/hp.ts#getMaxHitPoints) — calculado pelo NÍVEL TOTAL, nunca por uma classe específica; ao adquirir em nível superior ao 1º, aplica o bônus completo do nível atual (nunca soma retroativamente aumento por aumento). Nunca tratado como cura, PV Temp ou aumento de Constituição. Remover o talento retira só este bônus, preservando qualquer outra fonte de PV.",
  },

  // ===================== Talentos Gerais (nível 4+, só via ASI) =====================

  {
    id: ADEPTO_ELEMENTAL_FEAT_ID,
    name: "Adepto Elemental",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: característica Conjuração ou Magia de Pacto (nunca um truque/magia concedido por espécie ou talento). Repetível, sempre com um tipo de dano diferente — cada aquisição mantém o próprio aumento de atributo e o próprio tipo. Escolhe Ácido, Elétrico, Frio, Fogo ou Trovão: magias que o personagem conjura ignoram Resistência a esse tipo de dano (nunca Imunidade); ao jogar o dano de uma magia que cause esse tipo, pode tratar qualquer 1 nos dados de dano como 2 — não é uma nova rolagem, e nunca vale para ataques que não sejam magias. +1 em Inteligência, Sabedoria ou Carisma, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: ADEPTO_ELEMENTAL_DAMAGE_CHOICE_BASE_ID, prompt: "Adepto Elemental — tipo de dano (diferente a cada aquisição)", effect: { kind: "optionPick", options: [...ADEPTO_ELEMENTAL_DAMAGE_TYPES] } },
      { id: `${ADEPTO_ELEMENTAL_FEAT_ID}-atributo`, prompt: "Adepto Elemental — aumente em 1 (máx. 20): Inteligência, Sabedoria ou Carisma", effect: { kind: "abilityScoreIncrease", options: ["INT", "SAB", "CAR"] } },
    ],
  },
  {
    id: AGRESSOR_FEAT_ID,
    name: "Agressor",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Força ou Destreza 13. Nunca repetível. Corrida Aprimorada: ao executar a ação Correr, o Deslocamento aumenta 3m só para essa ação (nunca o Deslocamento permanente). Ataque de Investida: uma vez em cada um dos próprios turnos, se o personagem se mover pelo menos 3m em linha reta em direção ao alvo imediatamente antes de acertar um ataque corpo a corpo como parte da ação Atacar, escolhe (na hora, nunca uma decisão permanente do Builder): +1d8 no dano desse ataque, ou empurrar o alvo até 3m para longe, se ele for no máximo um tamanho maior que o personagem. Não exige Ação Bônus adicional. +1 em Força ou Destreza, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${AGRESSOR_FEAT_ID}-atributo`, prompt: "Agressor — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } },
    ],
  },
  {
    id: ANALITICO_FEAT_ID,
    name: "Analítico",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Inteligência ou Sabedoria 13. Nunca repetível. Mente Observadora: escolhe Intuição, Investigação ou Percepção (etapa Perícias) — sem proficiência nela por outra fonte, ganha proficiência; já proficiente por outra fonte, ganha Especialização (`skillProficiencyOrExpertise`, revalidado a cada leitura: a própria concessão de Analítico nunca conta como \"já proficiente\"; uma perícia já com Especialização por outra fonte não é oferecida). Pesquisa Rápida: pode executar a ação Procurar como Ação Bônus. +1 em Inteligência ou Sabedoria, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: ANALITICO_SKILL_CHOICE_ID, prompt: "Analítico — Intuição/Investigação/Percepção: proficiência (ou Especialização, se já proficiente por outra fonte)", effect: { kind: "skillProficiencyOrExpertise", options: [...ANALITICO_SKILL_OPTIONS] } },
      { id: `${ANALITICO_FEAT_ID}-atributo`, prompt: "Analítico — aumente em 1 (máx. 20): Inteligência ou Sabedoria", effect: { kind: "abilityScoreIncrease", options: ["INT", "SAB"] } },
    ],
  },
  {
    id: ATIRADOR_ARCANO_FEAT_ID,
    name: "Atirador Arcano",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: característica Conjuração ou Magia de Pacto. Nunca repetível. Contornar Cobertura: ataques com magia ignoram Cobertura Parcial e Cobertura de Três Quartos. Conjuração à Queima-Roupa: estar a 1,5m de um inimigo não impõe Desvantagem nas jogadas de ataque com magia. Alcance Aumentado: ao conjurar uma magia com alcance de pelo menos 3m que exija jogada de ataque, pode aumentar o alcance dela em 18m — nunca para magias sem jogada de ataque, de toque ou com alcance menor que 3m. +1 em Inteligência, Sabedoria ou Carisma, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${ATIRADOR_ARCANO_FEAT_ID}-atributo`, prompt: "Atirador Arcano — aumente em 1 (máx. 20): Inteligência, Sabedoria ou Carisma", effect: { kind: "abilityScoreIncrease", options: ["INT", "SAB", "CAR"] } },
    ],
  },
  {
    id: ATLETA_FEAT_ID,
    name: "Atleta",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Força ou Destreza 13. Nunca repetível. Velocidade de Escalada: Deslocamento de Escalada igual ao Deslocamento (`rules/speed.ts#getClimbSpeed`, acompanha qualquer alteração do Deslocamento). Levantar-se: levantar-se da condição Caído custa só 1,5m de movimento. Saltar: um Salto em Distância ou em Altura com corrida exige só 1,5m de movimento prévio — nunca aumenta a distância do salto. +1 em Força ou Destreza, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${ATLETA_FEAT_ID}-atributo`, prompt: "Atleta — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } },
    ],
  },
  {
    id: ATOR_FEAT_ID,
    name: "Ator",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Carisma 13. Nunca repetível. Personificação: disfarçado como uma pessoa real ou fictícia, tem Vantagem nos testes de Carisma (Atuação ou Enganação) para convencer os outros de que é essa pessoa — nunca Vantagem permanente em todos os testes dessas perícias. Imitação: pode imitar sons de outras criaturas, inclusive fala; quem ouve pode perceber que é uma imitação com um teste bem-sucedido de Sabedoria (Intuição) contra CD 8 + mod CAR + Bônus de Proficiência (`rules/feats.ts#getActorCd` — nunca o atributo de conjuração da classe). +1 em Carisma, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${ATOR_FEAT_ID}-atributo`, prompt: "Ator — aumente em 1 (máx. 20): Carisma", effect: { kind: "abilityScoreIncrease", options: ["CAR"] } },
    ],
  },
  {
    id: CHEF_FEAT_ID,
    name: "Chef",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Utensílios de Cozinheiro: proficiência com essa ferramenta (campo de ferramentas — nunca concede o item físico). Refeição Satisfatória: durante um Descanso Curto, com ingredientes e Utensílios de Cozinheiro, pode preparar comida para até 4 + Bônus de Proficiência criaturas; ao fim do descanso, quem comer e gastar ao menos um Dado de Vida recupera 1d8 PV extras (uma vez por criatura nesse descanso, nunca por dado gasto). Guloseimas Revigorantes: com 1 hora de trabalho ou ao terminar um Descanso Longo, com ingredientes e utensílios, pode preparar BP guloseimas, que duram 8 horas; comer uma exige Ação Bônus e concede PV Temporários iguais ao BP do cozinheiro. Guloseimas são itens produzidos durante o jogo — nunca uma reserva de usos por Descanso Longo nem um marcador fixo na ficha. +1 em Constituição ou Sabedoria, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${CHEF_FEAT_ID}-atributo`, prompt: "Chef — aumente em 1 (máx. 20): Constituição ou Sabedoria", effect: { kind: "abilityScoreIncrease", options: ["CON", "SAB"] } },
    ],
  },
  {
    id: COMBATENTE_MONTADO_FEAT_ID,
    name: "Combatente Montado",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Enquanto montado: Golpe Montado — Vantagem nas jogadas de ataque contra qualquer criatura desmontada a até 1,5m da montaria que seja pelo menos um tamanho menor que ela (não restrito a ataques corpo a corpo); Pulo Lateral — se a montaria for alvo de um efeito que permite uma Salvaguarda de Destreza para sofrer só metade do dano, ela não sofre dano algum se passar e só metade se falhar (exige estar montado e que nenhum dos dois esteja Incapacitado); Redirecionar Ataque — quando um ataque atinge a montaria, o personagem pode fazer esse ataque atingi-lo no lugar dela, desde que não esteja Incapacitado (sem Reação, Salvaguarda ou teste adicionais). +1 em Força, Destreza ou Sabedoria, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${COMBATENTE_MONTADO_FEAT_ID}-atributo`, prompt: "Combatente Montado — aumente em 1 (máx. 20): Força, Destreza ou Sabedoria", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX", "SAB"] } },
    ],
  },
  {
    id: CONJURADOR_BELICO_FEAT_ID,
    name: "Conjurador Bélico",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: característica Conjuração ou Magia de Pacto. Nunca repetível. Concentração: Vantagem nas Salvaguardas de Constituição para manter Concentração (nunca em todas as Salvaguardas de Constituição). Magia Reativa: quando uma criatura provoca um Ataque de Oportunidade do personagem ao sair do alcance dele, ele pode usar a Reação para conjurar nela uma magia em vez de fazer o ataque — a magia precisa ter tempo de conjuração de uma ação e ter só essa criatura como alvo; os custos normais da magia continuam valendo (nunca conjuração gratuita). Componentes Somáticos: pode executar os componentes somáticos de magias mesmo com armas ou Escudo em uma ou ambas as mãos. +1 em Inteligência, Sabedoria ou Carisma, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${CONJURADOR_BELICO_FEAT_ID}-atributo`, prompt: "Conjurador Bélico — aumente em 1 (máx. 20): Inteligência, Sabedoria ou Carisma", effect: { kind: "abilityScoreIncrease", options: ["INT", "SAB", "CAR"] } },
    ],
  },
  {
    id: CONJURADOR_RITUALISTA_FEAT_ID,
    name: "Conjurador Ritualista",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Inteligência, Sabedoria ou Carisma 13. Nunca repetível. Magias Ritualísticas: escolhe magias diferentes de 1º círculo com o marcador Ritual (sem restrição de lista de classe), em quantidade igual ao Bônus de Proficiência — uma escolha nova aparece sempre que o BP aumenta; ficam sempre preparadas (área de Magias, `rules/featAutoPreparedSpells.ts`), usam o atributo aumentado por este talento como atributo de conjuração (nunca uma escolha independente) e podem ser conjuradas com espaços de magia disponíveis — nunca concedem espaços nem contam no limite de Magias Preparadas da classe. Ritual Rápido: uma vez por Descanso Longo, pode conjurar uma magia Ritual que tenha preparada (não só as deste talento, nem só de 1º círculo) usando o tempo de conjuração normal, sem gastar espaço de magia — um único uso compartilhado. +1 em Inteligência, Sabedoria ou Carisma, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: CONJURADOR_RITUALISTA_SPELL_CHOICE_BASE_IDS[0], prompt: "Conjurador Ritualista — magia Ritual de 1º círculo 1 (catálogo de magias pendente — entrada manual)", effect: { kind: "manualText", placeholder: "Nome da magia de 1º círculo com Ritual" } },
      { id: CONJURADOR_RITUALISTA_SPELL_CHOICE_BASE_IDS[1], prompt: "Conjurador Ritualista — magia Ritual de 1º círculo 2 (catálogo de magias pendente — entrada manual)", effect: { kind: "manualText", placeholder: "Nome da magia de 1º círculo com Ritual" } },
      { id: CONJURADOR_RITUALISTA_SPELL_CHOICE_BASE_IDS[2], prompt: "Conjurador Ritualista — magia Ritual de 1º círculo 3 (catálogo de magias pendente — entrada manual)", effect: { kind: "manualText", placeholder: "Nome da magia de 1º círculo com Ritual" } },
      { id: CONJURADOR_RITUALISTA_SPELL_CHOICE_BASE_IDS[3], prompt: "Conjurador Ritualista — magia Ritual de 1º círculo 4 (catálogo de magias pendente — entrada manual)", effect: { kind: "manualText", placeholder: "Nome da magia de 1º círculo com Ritual" } },
      { id: CONJURADOR_RITUALISTA_SPELL_CHOICE_BASE_IDS[4], prompt: "Conjurador Ritualista — magia Ritual de 1º círculo 5 (catálogo de magias pendente — entrada manual)", effect: { kind: "manualText", placeholder: "Nome da magia de 1º círculo com Ritual" } },
      { id: CONJURADOR_RITUALISTA_SPELL_CHOICE_BASE_IDS[5], prompt: "Conjurador Ritualista — magia Ritual de 1º círculo 6 (catálogo de magias pendente — entrada manual)", effect: { kind: "manualText", placeholder: "Nome da magia de 1º círculo com Ritual" } },
      { id: `${CONJURADOR_RITUALISTA_FEAT_ID}-atributo`, prompt: "Conjurador Ritualista — aumente em 1 (máx. 20): Inteligência, Sabedoria ou Carisma (também o atributo de conjuração das magias deste talento)", effect: { kind: "abilityScoreIncrease", options: ["INT", "SAB", "CAR"] } },
    ],
  },
  {
    id: DUELISTA_DEFENSIVO_FEAT_ID,
    name: "Duelista Defensivo",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Destreza 13. Nunca repetível. Aparar: segurando uma arma com a propriedade Acuidade, quando outra criatura o atinge com um ataque corpo a corpo, pode usar a Reação para somar o Bônus de Proficiência à CA contra esse ataque, o que pode fazê-lo errar; o bônus continua valendo contra ataques corpo a corpo até o início do próximo turno do personagem. Nunca aumenta a CA permanentemente nem vale contra ataques à distância; acompanha o BP atual. +1 em Destreza, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${DUELISTA_DEFENSIVO_FEAT_ID}-atributo`, prompt: "Duelista Defensivo — aumente em 1 (máx. 20): Destreza", effect: { kind: "abilityScoreIncrease", options: ["DEX"] } },
    ],
  },
  {
    id: ENVENENADOR_FEAT_ID,
    name: "Envenenador",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Veneno Potente: jogadas de dano Venenoso do personagem ignoram Resistência a dano Venenoso (nunca Imunidade; não só o veneno deste talento). Preparar Veneno: proficiência com Kit de Veneno (campo de ferramentas); com o kit, 1 hora de trabalho e 50 PO em materiais, fabrica BP doses (sem limite por Descanso Longo). Aplicar uma dose numa arma ou munição exige Ação Bônus; dura 1 minuto ou até causar dano com o item. Ao causar esse dano, o alvo faz Salvaguarda de Constituição contra CD 8 + mod do atributo aumentado por este talento + BP (`rules/feats.ts#getPoisonerCd` — nunca o maior entre DEX e INT automaticamente); se falhar, sofre 2d8 de dano Venenoso e fica Envenenado até o fim do próximo turno de quem aplicou. Doses são consumíveis fabricados durante o jogo — nunca um contador fixo na ficha. +1 em Destreza ou Inteligência, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${ENVENENADOR_FEAT_ID}-atributo`, prompt: "Envenenador — aumente em 1 (máx. 20): Destreza ou Inteligência", effect: { kind: "abilityScoreIncrease", options: ["DEX", "INT"] } },
    ],
  },
  {
    id: ESMAGADOR_FEAT_ID,
    name: "Esmagador",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Empurrão: uma vez por turno (não só no próprio), ao acertar uma criatura com um ataque que cause dano Contundente, pode movê-la 1,5m para um espaço desocupado, se ela for no máximo um tamanho maior que o personagem — sem Salvaguarda, não necessariamente para longe, não restrito a armas nem a ataques corpo a corpo. Ataque Aprimorado: ao causar um Acerto Crítico com dano Contundente, as jogadas de ataque contra essa criatura (de qualquer atacante) têm Vantagem até o início do próximo turno do personagem. +1 em Força ou Constituição, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${ESMAGADOR_FEAT_ID}-atributo`, prompt: "Esmagador — aumente em 1 (máx. 20): Força ou Constituição", effect: { kind: "abilityScoreIncrease", options: ["FOR", "CON"] } },
    ],
  },
  {
    id: AMBIDESTRO_FEAT_ID,
    name: "Ambidestro",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Força ou Destreza 13. Nunca repetível. Combate com Duas Armas Aprimorado: ao executar a ação Atacar no próprio turno atacando com uma arma Leve, pode fazer um ataque adicional como Ação Bônus nesse mesmo turno com uma arma diferente, que deve ser Corpo a Corpo e sem a propriedade Duas Mãos (não precisa ser Leve); não soma o modificador de atributo ao dano desse ataque adicional, a menos que seja negativo (exceções de outras características já cadastradas continuam valendo). Saque Rápido: pode sacar ou guardar duas armas sem a propriedade Duas Mãos quando normalmente poderia sacar ou guardar só uma. +1 em Força ou Destreza, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${AMBIDESTRO_FEAT_ID}-atributo`, prompt: "Ambidestro — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } },
    ],
  },
  {
    id: ESPECIALISTA_ARMADURAS_LEVES_FEAT_ID,
    name: "Especialista em Armaduras Leves",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Treinamento com Armaduras Leves e com Escudos (`rules/armor.ts#hasArmorTraining` — campos de proficiência e lista de armaduras elegíveis; nunca equipa armadura nem Escudo, nunca soma CA sem equipamento). Remover o talento retira só esta concessão, preservando treinamento de outras origens. +1 em Força ou Destreza, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${ESPECIALISTA_ARMADURAS_LEVES_FEAT_ID}-atributo`, prompt: "Especialista em Armaduras Leves — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } },
    ],
  },
  {
    id: ESPECIALISTA_ARMADURAS_MEDIAS_FEAT_ID,
    name: "Especialista em Armaduras Médias",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: treinamento com Armadura Leve. Nunca repetível. Treinamento com Armaduras Médias (`rules/armor.ts#hasArmorTraining`) — nunca com Escudos (treinamento com Escudos de outra origem é preservado). Remover o talento retira só esta concessão. +1 em Força ou Destreza, limitado a 20 (`abilityScoreIncrease`).",
    choices: [
      { id: `${ESPECIALISTA_ARMADURAS_MEDIAS_FEAT_ID}-atributo`, prompt: "Especialista em Armaduras Médias — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } },
    ],
  },

  {
    id: ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID,
    name: "Especialista em Armaduras Pesadas",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: treinamento com Armadura Média. Nunca repetível. Concede treinamento com Armadura Pesada — soma a `character.armor.proficiencies.heavy` ao ser escolhido em ASI (`state/characterStore.ts#applyFeatArmorProficiencies`), nunca substitui/reseta as demais proficiências de armadura, nunca equipa uma armadura automaticamente. +1 em Constituição ou Força, limitado a 20 (`abilityScoreIncrease`) — a checagem do pré-requisito de Armadura Média nunca é satisfeita pelo próprio talento (ele não concede treinamento médio, só pesado).",
    choices: [{ id: `${ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID}-atributo`, prompt: "Especialista em Armaduras Pesadas — aumente em 1 (máx. 20): Constituição ou Força", effect: { kind: "abilityScoreIncrease", options: ["CON", "FOR"] } }],
  },
  {
    id: ESPECIALISTA_BESTA_FEAT_ID,
    name: "Especialista em Besta",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Destreza 13. Nunca repetível. Com Besta de Mão, Besta Leve ou Besta Pesada: ignora a propriedade Recarga; pode carregar munição e recarregar sem precisar de uma mão livre; uma criatura a até 1,5m nunca impõe Desvantagem nesses ataques (preserva qualquer outra fonte de Desvantagem, só remove a de inimigo adjacente). Ao usar a ação Atacar com uma Besta Leve e fazer o ataque adicional da própria propriedade Leve, pode somar o modificador do atributo ao dano desse ataque adicional SE ele ainda não estiver incluso — nunca soma duas vezes, nunca concede um ataque extra independente da propriedade Leve em si (texto-only: não há dado de dano estruturado por arma neste projeto, decisão já aprovada em `character.attacks`). +1 em Destreza, limitado a 20.",
    choices: [{ id: `${ESPECIALISTA_BESTA_FEAT_ID}-atributo`, prompt: "Especialista em Besta — aumente em 1 (máx. 20): Destreza", effect: { kind: "abilityScoreIncrease", options: ["DEX"] } }],
  },
  {
    id: ESPECIALISTA_PERICIA_FEAT_ID,
    name: "Especialista em Perícia",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Concede, na etapa Perícias: (1) proficiência numa perícia à escolha (excluindo as já proficientes); (2) Especialização numa perícia proficiente ainda sem Especialização — a perícia escolhida em (1) já conta como proficiente ao abrir a escolha (2), podendo ser a mesma; nunca concede Especialização em ferramenta. +1 em qualquer atributo, limitado a 20.",
    choices: [
      { id: ESPECIALISTA_PERICIA_SKILL_CHOICE_ID, prompt: "Especialista em Perícia — proficiência em 1 perícia", effect: { kind: "skillProficiency", options: "any", count: 1, excludeAlreadyProficient: true } },
      { id: ESPECIALISTA_PERICIA_EXPERTISE_CHOICE_ID, prompt: "Especialista em Perícia — Especialização em 1 perícia proficiente", effect: { kind: "skillExpertise", count: 1 } },
      {
        id: `${ESPECIALISTA_PERICIA_FEAT_ID}-atributo`,
        prompt: "Especialista em Perícia — aumente em 1 (máx. 20): qualquer atributo",
        effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX", "CON", "INT", "SAB", "CAR"] },
      },
    ],
  },
  {
    id: EXTERMINADOR_DE_CONJURADORES_FEAT_ID,
    name: "Exterminador de Conjuradores",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Quebrador de Concentração: ao causar dano a uma criatura concentrada numa magia, ela tem Desvantagem na Salvaguarda para manter a Concentração — vale para qualquer dano causado pelo personagem, não só ataques corpo a corpo nem só no próprio turno. Resguardo Mental: ao falhar numa Salvaguarda de Inteligência, Sabedoria ou Carisma, pode gastar 1 uso (reserva compartilhada entre as 3, recupera em Descanso Curto OU Longo) para passar no teste — nunca exige Reação, nunca é uma nova rolagem, nunca depende de a Salvaguarda ter sido provocada por magia. +1 em Força ou Destreza, limitado a 20.",
    choices: [{ id: `${EXTERMINADOR_DE_CONJURADORES_FEAT_ID}-atributo`, prompt: "Exterminador de Conjuradores — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } }],
  },
  {
    id: IMOBILIZADOR_FEAT_ID,
    name: "Imobilizador",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Força ou Destreza 13. Nunca repetível. Socar e Imobilizar: uma vez por turno, ao acertar um Ataque Desarmado como parte da ação Atacar no próprio turno, pode causar o dano normal E tentar Imobilizar o alvo com a mesma ação — a imobilização segue a resolução normal (Salvaguarda/restrições de tamanho), o acerto do Ataque Desarmado não garante sucesso automático nela. Vantagem em ataques contra uma criatura que o próprio personagem tenha Imobilizado (nunca contra alvo imobilizado por outra fonte). Transportar uma criatura Imobilizada do próprio tamanho ou menor não gasta movimento adicional. +1 em Força ou Destreza, limitado a 20.",
    choices: [{ id: `${IMOBILIZADOR_FEAT_ID}-atributo`, prompt: "Imobilizador — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } }],
  },
  {
    id: LIDER_INSPIRADOR_FEAT_ID,
    name: "Líder Inspirador",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Sabedoria ou Carisma 13. Nunca repetível. Ao completar um Descanso Curto ou Longo, pode fazer um discurso/música/dança inspiradora e conceder PV Temporários = nível total do personagem + modificador do atributo escolhido neste talento (nunca o maior modificador automaticamente — usa SEMPRE o atributo efetivamente aumentado por esta aquisição) a até 6 criaturas à escolha, a até 9m, que tenham presenciado a atuação, podendo incluir o próprio personagem. Nunca uma reserva de usos por descanso — o limite de 6 é só a quantidade de alvos por atuação, não um contador consumível. +1 em Sabedoria ou Carisma, limitado a 20.",
    choices: [{ id: `${LIDER_INSPIRADOR_FEAT_ID}-atributo`, prompt: "Líder Inspirador — aumente em 1 (máx. 20): Sabedoria ou Carisma", effect: { kind: "abilityScoreIncrease", options: ["SAB", "CAR"] } }],
  },
  {
    id: MENTE_AGUCADA_FEAT_ID,
    name: "Mente Aguçada",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Inteligência 13. Nunca repetível. Escolhe 1 entre Arcanismo/História/Investigação/Natureza/Religião: se o personagem ainda não for proficiente nela, ganha proficiência; se já for, ganha Especialização no lugar (`skillProficiencyOrExpertise`, domain/features.ts — revalidado a cada leitura, nunca uma decisão travada no momento da escolha). Pode executar a ação Analisar como Ação Bônus. +1 em Inteligência, limitado a 20.",
    choices: [
      { id: MENTE_AGUCADA_SKILL_CHOICE_ID, prompt: "Mente Aguçada — Arcanismo/História/Investigação/Natureza/Religião: proficiência (ou Especialização, se já proficiente)", effect: { kind: "skillProficiencyOrExpertise", options: [...MENTE_AGUCADA_SKILL_OPTIONS] } },
      { id: `${MENTE_AGUCADA_FEAT_ID}-atributo`, prompt: "Mente Aguçada — aumente em 1 (máx. 20): Inteligência", effect: { kind: "abilityScoreIncrease", options: ["INT"] } },
    ],
  },
  {
    id: MESTRE_DAS_ARMAS_FEAT_ID,
    name: "Mestre das Armas",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Concede o uso da propriedade de Maestria de 1 arma Simples ou Marcial com a qual o personagem já seja proficiente — nunca concede a própria proficiência com a arma, nunca concede todas as Maestrias de uma vez. Pode trocar para outra arma elegível ao completar um Descanso Longo — decisão tomada durante o jogo, por isso a anotação é um campo de texto opcional, nunca uma escolha obrigatória para concluir a criação, e a arma escolhida nunca é fixada no PDF (`rules/featTalentEntries.ts`: texto sempre genérico).",
    choices: [{ id: MESTRE_DAS_ARMAS_NOTE_CHOICE_ID, prompt: "Mestre das Armas — arma atual com Maestria ativa (anotação sua, troca em Descanso Longo — nunca obrigatório)", effect: { kind: "manualText", placeholder: "Nome da arma (opcional)" } }, { id: `${MESTRE_DAS_ARMAS_FEAT_ID}-atributo`, prompt: "Mestre das Armas — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } }],
  },
  {
    id: MESTRE_EM_ARMADURAS_MEDIAS_FEAT_ID,
    name: "Mestre em Armaduras Médias",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: treinamento com Armadura Média. Nunca repetível. Enquanto estiver usando Armadura Média, com Destreza 16 ou superior, pode somar até +3 do modificador de Destreza à CA (em vez do +2 normal de Armadura Média) — `rules/armor.ts#getArmorClass`, nunca soma +3 além do que a armadura já concede, nunca afeta Armadura Leve/Pesada/CA sem armadura. Não remove Desvantagem em testes de Furtividade de Armadura Pesada (este talento não concede esse benefício).",
    choices: [{ id: `${MESTRE_EM_ARMADURAS_MEDIAS_FEAT_ID}-atributo`, prompt: "Mestre em Armaduras Médias — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } }],
  },
  {
    id: MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID,
    name: "Mestre em Armaduras Pesadas",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: treinamento com Armadura Pesada. Nunca repetível. Enquanto estiver vestindo Armadura Pesada, ao ser atingido por um ataque, reduz o dano Contundente, Cortante ou Perfurante causado por esse ataque em uma quantidade igual ao Bônus de Proficiência (`rules/feats.ts#getHeavyArmorMasterReduction`) — vale só para ataques (nunca dano sem ataque associado), nunca se torna Resistência, nunca aumenta a CA, nunca cria uma reserva de usos limitada.",
    choices: [{ id: `${MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID}-atributo`, prompt: "Mestre em Armaduras Pesadas — aumente em 1 (máx. 20): Força ou Constituição", effect: { kind: "abilityScoreIncrease", options: ["FOR", "CON"] } }],
  },
  {
    id: MESTRE_EM_ARMAS_DE_HASTE_FEAT_ID,
    name: "Mestre em Armas de Haste",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Força ou Destreza 13. Nunca repetível. Vale para Cajado, Lança, ou qualquer arma com as propriedades Extensão e Pesada simultaneamente. Golpe de Haste: depois de atacar com uma dessas armas usando a ação Atacar, pode fazer imediatamente, como Ação Bônus, um Ataque corpo a corpo com a extremidade oposta da arma — dano 1d4 Contundente + modificador do atributo normalmente usado com a arma, nunca exige outra ação além da própria ação Atacar + a Ação Bônus, nunca impõe restrição extra ao ataque anterior. Golpe Reativo: enquanto empunhando uma dessas armas, pode usar a Reação para fazer um Ataque corpo a corpo contra uma criatura que entre no alcance da arma — é um ataque de Reação comum (interage normalmente com Sentinela e efeitos equivalentes), nunca automaticamente classificado como Ataque de Oportunidade.",
    choices: [{ id: `${MESTRE_EM_ARMAS_DE_HASTE_FEAT_ID}-atributo`, prompt: "Mestre em Armas de Haste — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } }],
  },
  {
    id: MESTRE_EM_ARMAS_GRANDES_FEAT_ID,
    name: "Mestre em Armas Grandes",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Força 13. Nunca repetível. Maestria em Armas Pesadas: ao acertar uma criatura com uma arma Pesada como parte da ação Atacar no próprio turno, pode somar o Bônus de Proficiência ao dano (`rules/feats.ts#getGreatWeaponMasterDamageBonus`) — não limitado a uma vez por turno, não restrito a corpo a corpo, não se aplica a um ataque feito só por usar a mesma arma fora da ação Atacar (ex.: Ataque de Oportunidade só conta se também satisfizer a condição). Cortar: imediatamente após causar um acerto crítico ou reduzir uma criatura a 0 PV com uma arma Corpo a Corpo (não precisa ser Pesada), pode fazer um Ataque com a mesma arma como Ação Bônus.",
    choices: [{ id: `${MESTRE_EM_ARMAS_GRANDES_FEAT_ID}-atributo`, prompt: "Mestre em Armas Grandes — aumente em 1 (máx. 20): Força", effect: { kind: "abilityScoreIncrease", options: ["FOR"] } }],
  },
  {
    id: MESTRE_EM_ESCUDOS_FEAT_ID,
    name: "Mestre em Escudos",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: treinamento com Escudo. Nunca repetível. Golpe de Escudo: uma vez em cada um dos próprios turnos, ao acertar uma criatura a até 1,5m com uma arma Corpo a Corpo na ação Atacar, enquanto equipado com Escudo, pode forçar uma Salvaguarda de Força (CD 8 + modificador de Força + Bônus de Proficiência, `rules/feats.ts#getShieldMasterCd`) — na falha, empurra o alvo 1,5m para longe OU o deixa Caído (escolha do personagem); nunca cobra Ação Bônus/Reação, nunca soma dano extra de escudo. Interpor Escudo: com um Escudo em mãos, ao passar numa Salvaguarda de Destreza que normalmente reduziria o dano à metade, pode usar a Reação para não sofrer dano algum em vez da metade.",
    choices: [{ id: `${MESTRE_EM_ESCUDOS_FEAT_ID}-atributo`, prompt: "Mestre em Escudos — aumente em 1 (máx. 20): Força", effect: { kind: "abilityScoreIncrease", options: ["FOR"] } }],
  },
  {
    id: MESTRE_ATIRADOR_FEAT_ID,
    name: "Mestre-Atirador",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Destreza 13. Nunca repetível. Ataques à distância feitos com uma arma ignoram Cobertura Parcial (1/2) e de Três Quartos (3/4) do alvo — nunca Cobertura Total. Uma criatura a até 1,5m nunca impõe Desvantagem em ataques feitos com armas da categoria À Distância, e atirar no alcance longo dessas armas também nunca impõe Desvantagem (preserva o alcance máximo normal — além dele, o ataque continua impossível). Distingue sempre 'ataque à distância feito com uma arma' (primeiro benefício) de 'arma da categoria À Distância' (os outros dois) — nunca confunde as duas condições.",
    choices: [{ id: `${MESTRE_ATIRADOR_FEAT_ID}-atributo`, prompt: "Mestre-Atirador — aumente em 1 (máx. 20): Destreza", effect: { kind: "abilityScoreIncrease", options: ["DEX"] } }],
  },
  {
    id: PERFURADOR_FEAT_ID,
    name: "Perfurador",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Uma vez por turno, ao acertar um ataque que cause dano Perfurante, pode repetir UM dos dados de dano desse ataque, usando obrigatoriamente o novo resultado — nunca repete todos os dados, nunca permite escolher manter o resultado anterior, não limitado ao próprio turno do personagem (só ao próprio ataque). Ao causar um acerto crítico com dano Perfurante, pode jogar 1 dado adicional de dano Perfurante — nunca dobra todos os dados de novo.",
    choices: [{ id: `${PERFURADOR_FEAT_ID}-atributo`, prompt: "Perfurador — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } }],
  },
  {
    id: RESILIENTE_FEAT_ID,
    name: "Resiliente",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Escolhe 1 atributo no qual o personagem ainda não seja proficiente em Salvaguarda — a MESMA escolha concede, simultaneamente, +1 nesse atributo (limitado a 20) E proficiência na Salvaguarda correspondente (`rules/savingThrows.ts#getResilientGrantedAbility`, somada em `getSavingThrow`). As opções elegíveis são recalculadas a cada personagem (`rules/feats.ts#buildFeatAcquisitionFeature`), nunca uma lista estática — nunca inclui um atributo já proficiente em Salvaguarda por outra origem (classe, Mente de Ferro, Mente Escorregadia etc.).",
    choices: [{ id: `${RESILIENTE_FEAT_ID}-atributo`, prompt: "Resiliente — escolha 1 atributo sem proficiência em Salvaguarda: +1 (máx. 20) e proficiência em Salvaguarda", effect: { kind: "abilityScoreIncrease", options: [] } }],
  },
  {
    id: RESISTENTE_FEAT_ID,
    name: "Resistente",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Desafie a Morte: Vantagem em Salvaguardas Contra a Morte. Recuperação Rápida: como Ação Bônus, pode gastar 1 Dado de Vida do personagem, jogá-lo, e recuperar PV igual ao resultado — nunca soma o modificador de Constituição, usa a reserva normal de Dados de Vida (nunca cria uma reserva própria), nunca exige um descanso para ficar disponível de novo (limitado só pelos próprios Dados de Vida restantes). +1 em Constituição, limitado a 20.",
    choices: [{ id: `${RESISTENTE_FEAT_ID}-atributo`, prompt: "Resistente — aumente em 1 (máx. 20): Constituição", effect: { kind: "abilityScoreIncrease", options: ["CON"] } }],
  },
  {
    id: SENTINELA_FEAT_ID,
    name: "Sentinela",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Força ou Destreza 13. Nunca repetível. Diligente: imediatamente depois de uma criatura a até 1,5m do personagem executar a ação Desengajar OU acertar um alvo diferente do próprio personagem, pode fazer um Ataque de Oportunidade contra ela — usa a Reação normalmente (nunca um ataque gratuito adicional), nunca exige que a criatura saia do alcance depois de Desengajar, nunca restringe o segundo gatilho a 'acertar um aliado' especificamente (qualquer alvo que não o próprio personagem conta). Deter: ao acertar um Ataque de Oportunidade, o Deslocamento da criatura atingida cai para 0 pelo restante do turno ATUAL dela — nunca se estende ao próximo turno, nunca se aplica a um ataque feito como Reação por outro motivo que não um Ataque de Oportunidade.",
    choices: [{ id: `${SENTINELA_FEAT_ID}-atributo`, prompt: "Sentinela — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } }],
  },
  {
    id: SORRATEIRO_FEAT_ID,
    name: "Sorrateiro",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Destreza 13. Nunca repetível. Visão às Cegas 3m — se outra fonte já conceder um alcance maior de Visão às Cegas, preserva o maior dos dois (nunca soma). Durante combate, Vantagem em testes de Destreza (Furtividade) feitos como parte da ação Esconder. Ao atacar enquanto escondido e ERRAR o ataque, o personagem não revela sua localização — nunca concede Vantagem em Furtividade fora de Esconder, nunca preserva automaticamente o esconderijo quando o ataque ACERTA.",
    choices: [{ id: `${SORRATEIRO_FEAT_ID}-atributo`, prompt: "Sorrateiro — aumente em 1 (máx. 20): Destreza", effect: { kind: "abilityScoreIncrease", options: ["DEX"] } }],
  },
  {
    id: TALHADOR_FEAT_ID,
    name: "Talhador",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Uma vez por turno, ao acertar um ataque que cause dano Cortante, pode reduzir o Deslocamento do alvo em 3m até o início do PRÓXIMO turno do personagem — não limitado ao próprio turno do personagem (só ao próprio ataque). Ao causar um acerto crítico com dano Cortante, o alvo tem Desvantagem em ataques até o início do próximo turno do personagem — nunca concede Desvantagem nas Salvaguardas/testes do alvo, só nos ataques dele.",
    choices: [{ id: `${TALHADOR_FEAT_ID}-atributo`, prompt: "Talhador — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } }],
  },
  {
    id: TELECINETICO_FEAT_ID,
    name: "Telecinético",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Telecinese Menor: concede o truque Mãos Mágicas, usando o atributo aumentado por este talento como atributo de conjuração (`rules/featAutoPreparedSpells.ts`). Ao conjurá-lo por esta concessão, pode dispensar os componentes Verbal e Somático, tornar a mão invisível, e aumentar em 9m tanto o alcance da magia quanto a distância máxima entre a mão e o personagem — nunca concede Ação Bônus para conjurá-lo/controlá-lo (continua usando o tempo de conjuração normal do truque). Empurrão Telecinético: como Ação Bônus, força 1 criatura à vista a até 9m a uma Salvaguarda de Força (CD 8 + modificador do atributo aumentado por este talento + Bônus de Proficiência, `rules/feats.ts#getTelekineticCd`) — na falha, move a criatura 1,5m na direção do personagem OU para longe dele, à escolha. Atributo de conjuração escolhido aqui NUNCA precisa ser o mesmo da classe, nem exige conjuração de classe para existir.",
    choices: [{ id: `${TELECINETICO_FEAT_ID}-atributo`, prompt: "Telecinético — aumente em 1 (máx. 20), também o atributo de conjuração deste talento: Inteligência, Sabedoria ou Carisma", effect: { kind: "abilityScoreIncrease", options: ["INT", "SAB", "CAR"] } }],
  },
  {
    id: TELEPATICO_FEAT_ID,
    name: "Telepático",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Enunciado Telepático: pode falar telepaticamente com 1 criatura à vista a até 18m, usando qualquer idioma que o personagem conheça — a criatura-alvo só compreende se também conhecer esse idioma, e nunca pode responder telepaticamente de volta (comunicação de mão única). Detectar Pensamentos: concedida como sempre preparada, usando o atributo aumentado por este talento; pode ser conjurada 1×/Descanso Longo sem gastar espaço de magia nem componentes, e normalmente usando espaços de magia disponíveis do círculo apropriado — nunca concede espaços de magia por si só, nunca consome o limite normal de Magias Preparadas da classe (`rules/featAutoPreparedSpells.ts`).",
    choices: [{ id: `${TELEPATICO_FEAT_ID}-atributo`, prompt: "Telepático — aumente em 1 (máx. 20), também o atributo de conjuração deste talento: Inteligência, Sabedoria ou Carisma", effect: { kind: "abilityScoreIncrease", options: ["INT", "SAB", "CAR"] } }],
  },
  {
    id: TOCADO_PELAS_SOMBRAS_FEAT_ID,
    name: "Tocado Pelas Sombras",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Escolhe 1 magia de 1º círculo da escola de Ilusão ou Necromancia (catálogo de magias pendente — entrada manual, nunca restrita a uma lista de classe que a fonte não exige). Concede, como sempre preparadas, usando o atributo aumentado por este talento: Invisibilidade E a magia escolhida — cada uma com seu PRÓPRIO uso independente de 1×/Descanso Longo sem gastar espaço (nunca uma reserva de 2 usos livremente distribuível entre as duas), e ambas também conjuráveis normalmente usando espaços de magia disponíveis do círculo apropriado.",
    choices: [
      { id: TOCADO_PELAS_SOMBRAS_SPELL_CHOICE_ID, prompt: "Tocado Pelas Sombras — magia de 1º círculo de Ilusão ou Necromancia (catálogo de magias pendente — entrada manual)", effect: { kind: "manualText", placeholder: "Nome da magia de 1º círculo (Ilusão ou Necromancia)" } },
      { id: `${TOCADO_PELAS_SOMBRAS_FEAT_ID}-atributo`, prompt: "Tocado Pelas Sombras — aumente em 1 (máx. 20), também o atributo de conjuração deste talento: Inteligência, Sabedoria ou Carisma", effect: { kind: "abilityScoreIncrease", options: ["INT", "SAB", "CAR"] } },
    ],
  },
  {
    id: TOCADO_POR_FADAS_FEAT_ID,
    name: "Tocado Por Fadas",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Escolhe 1 magia de 1º círculo da escola de Adivinhação ou Encantamento (catálogo de magias pendente — entrada manual, nunca restrita a uma lista de classe que a fonte não exige). Concede, como sempre preparadas, usando o atributo aumentado por este talento: Passo Nebuloso E a magia escolhida — cada uma com seu PRÓPRIO uso independente de 1×/Descanso Longo sem gastar espaço (nunca uma reserva de 2 usos livremente distribuível entre as duas), e ambas também conjuráveis normalmente usando espaços de magia disponíveis do círculo apropriado.",
    choices: [
      { id: TOCADO_POR_FADAS_SPELL_CHOICE_ID, prompt: "Tocado Por Fadas — magia de 1º círculo de Adivinhação ou Encantamento (catálogo de magias pendente — entrada manual)", effect: { kind: "manualText", placeholder: "Nome da magia de 1º círculo (Adivinhação ou Encantamento)" } },
      { id: `${TOCADO_POR_FADAS_FEAT_ID}-atributo`, prompt: "Tocado Por Fadas — aumente em 1 (máx. 20), também o atributo de conjuração deste talento: Inteligência, Sabedoria ou Carisma", effect: { kind: "abilityScoreIncrease", options: ["INT", "SAB", "CAR"] } },
    ],
  },
  {
    id: TREINAMENTO_COM_ARMAS_MARCIAIS_FEAT_ID,
    name: "Treinamento com Armas Marciais",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Sem pré-requisito adicional. Nunca repetível. Concede proficiência com armas Marciais — entra como entrada própria no campo de Proficiências/Armas (`rules/featTalentEntries.ts#getFeatWeaponProficiencyEntries`, nunca sobrescreve o texto da classe), atualizando a elegibilidade de ataque conforme a arma usada. Nunca concede Maestria de Arma nem Estilo de Luta — só a proficiência em si.",
    choices: [{ id: `${TREINAMENTO_COM_ARMAS_MARCIAIS_FEAT_ID}-atributo`, prompt: "Treinamento com Armas Marciais — aumente em 1 (máx. 20): Força ou Destreza", effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] } }],
  },
  {
    id: VELOCISTA_FEAT_ID,
    name: "Velocista",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 4+. Pré-requisito: Destreza ou Constituição 13. Nunca repetível. +3m de Deslocamento (`rules/feats.ts#getFeatSpeedBonus`, somado em `rules/speed.ts#getSpeed`). Ao executar a ação Correr no próprio turno, Terreno Difícil não exige movimento adicional pelo restante do turno — nunca concede imunidade a Ataque de Oportunidade nem ignora Terreno Difícil fora da ação Correr (texto-only: não há rastreamento estruturado de Terreno Difícil/ação Correr no projeto). Ataques de Oportunidade feitos contra o personagem têm Desvantagem.",
    choices: [{ id: `${VELOCISTA_FEAT_ID}-atributo`, prompt: "Velocista — aumente em 1 (máx. 20): Destreza ou Constituição", effect: { kind: "abilityScoreIncrease", options: ["DEX", "CON"] } }],
  },
];

/** Os 10 Talentos de Origem do catálogo — subconjunto de `generalFeats` filtrado por `ORIGIN_FEAT_IDS`, usado pela escolha de "Talento de Origem" do Humano (`rules/feats.ts#getAvailableOriginFeatsForHumanSpecies`). */
export const originFeats: FeatureDefinition[] = generalFeats.filter((feat) => (ORIGIN_FEAT_IDS as readonly string[]).includes(feat.id));
