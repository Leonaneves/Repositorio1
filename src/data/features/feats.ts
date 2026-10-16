import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Catálogo dos 10 Talentos de Origem do PHB 2024 (fonte "IMPLEMENTAR
 * TALENTOS DE ORIGEM NO BUILDER E NO PDF") — Alerta, Artifista, Atacante
 * Selvagem, Curandeiro, Habilidoso, Iniciado em Magia, Músico, Sortudo,
 * Valentão de Taverna, Vigoroso. Nunca aumentam atributo nem têm
 * pré-requisito (nenhum é inventado aqui, conforme a fonte).
 *
 * Estas são as entradas-BASE do catálogo — cada uma representa "o
 * talento em si", nunca uma aquisição específica. Uma aquisição real
 * (pelo Antecedente OU por uma escolha de ASI) é construída por
 * `rules/feats.ts#instantiateFeatAcquisition`, que copia esta entrada e
 * PARAMETRIZA o id de cada `FeatureChoice` interna com uma chave de
 * aquisição (`background` ou `asi-{nível}`) — nunca usa os ids
 * declarados aqui diretamente em `character.featureChoiceSelections`,
 * exceto quando só pode existir UMA aquisição ativa por vez (o próprio
 * mecanismo de `asiSelections`/antecedente já impede isso para os 8
 * talentos não-repetíveis, mas a parametrização é uniforme pelos 10,
 * nunca um caso especial por talento).
 *
 * Só Habilidoso e Iniciado em Magia são repetíveis (`repeatable: true`)
 * — os outros 8 só podem estar ativos em UMA aquisição por vez
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
];
