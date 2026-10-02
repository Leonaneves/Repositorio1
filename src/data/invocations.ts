import type { InvocationDefinition } from "../domain/invocations.js";

/**
 * Catálogo das 28 Invocações Místicas desta fonte ("INTEGRAÇÃO
 * COMPLETA — BRUXO, INVOCAÇÕES MÍSTICAS E SUBCLASSES") — regra
 * mecânica completa de cada uma (nunca o texto compacto do PDF, que
 * mora em `rules/warlockPrintedFeatures.ts`). `rules/invocations.ts`
 * resolve elegibilidade/repetibilidade/dependências a partir daqui +
 * `Character.chosenInvocations`.
 */
export const warlockInvocations: InvocationDefinition[] = [
  {
    id: "armadura-de-sombras",
    name: "Armadura de Sombras",
    prerequisite: {},
    repeatable: false,
    summary: "Pode conjurar Armadura Arcana em si mesmo, sem gastar espaço de magia (magia sempre disponível, origem: Armadura de Sombras).",
  },
  {
    id: "explosao-agonizante",
    name: "Explosão Agonizante",
    prerequisite: { minLevel: 2 },
    repeatable: true,
    subChoice: { label: "Truque de Bruxo conhecido que cause dano (precisa ser diferente em cada cópia desta invocação)", required: true },
    summary: "Exige um Truque de Bruxo conhecido que cause dano. Some seu modificador de Carisma às jogadas de dano desse Truque.",
  },
  {
    id: "explosao-repulsiva",
    name: "Explosão Repulsiva",
    prerequisite: { minLevel: 2 },
    repeatable: true,
    subChoice: { label: "Truque de Bruxo com dano que use jogada de ataque (precisa ser diferente em cada cópia desta invocação)", required: true },
    summary:
      "Exige um Truque de Bruxo com dano que use jogada de ataque. Ao acertar uma criatura Grande ou menor com esse Truque, pode empurrá-la até 3m.",
  },
  {
    id: "investimento-mestre-da-corrente",
    name: "Investimento do Mestre da Corrente",
    prerequisite: { minLevel: 5, requiresInvocationId: "pacto-da-corrente" },
    repeatable: false,
    summary:
      "O familiar do Pacto da Corrente ganha: Voo ou Natação 12m; Ataque Rápido (Ação Bônus para ordenar o familiar a Atacar); salvaguardas impostas por ele usam a CD de magia do Bruxo; seu dano Contundente/Cortante/Perfurante pode virar Necrótico ou Radiante; quando o familiar sofre dano, Reação do Bruxo concede Resistência a ele contra esse dano.",
  },
  {
    id: "lamento-das-sepulturas",
    name: "Lamento das Sepulturas",
    prerequisite: { minLevel: 7 },
    repeatable: false,
    summary: "Pode conjurar Falar com Mortos sem gastar espaço de magia (magia sempre disponível, origem: Lamento das Sepulturas).",
  },
  {
    id: "lamina-sedenta",
    name: "Lâmina Sedenta",
    prerequisite: { minLevel: 5, requiresInvocationId: "pacto-da-lamina" },
    repeatable: false,
    summary: "Ao usar a ação Atacar com sua arma de pacto, pode fazer 2 ataques em vez de 1.",
  },
  {
    id: "lamina-devoradora",
    name: "Lâmina Devoradora",
    prerequisite: { minLevel: 12, requiresInvocationId: "lamina-sedenta" },
    repeatable: false,
    summary:
      "Atualiza o Ataque Extra concedido por Lâmina Sedenta: ao usar a ação Atacar com sua arma de pacto, agora faz 3 ataques em vez de 1. As duas invocações continuam registradas no personagem (Lâmina Sedenta é pré-requisito desta), mas a impressão mostra só a versão final (3 ataques), nunca as duas ao mesmo tempo.",
  },
  {
    id: "lanca-mistica",
    name: "Lança Mística",
    prerequisite: { minLevel: 2 },
    repeatable: true,
    subChoice: {
      label: "Truque de Bruxo conhecido que cause dano e tenha alcance mínimo de 3m (precisa ser diferente em cada cópia desta invocação)",
      required: true,
    },
    summary: "O alcance do Truque escolhido aumenta em 9m × seu nível de Bruxo, somado ao alcance original.",
  },
  {
    id: "licoes-dos-grandes-antigos",
    name: "Lições dos Grandes Antigos",
    prerequisite: { minLevel: 2 },
    repeatable: true,
    subChoice: { label: "Talento de Origem (precisa ser diferente em cada cópia desta invocação)", required: true },
    summary: "Cada aquisição concede 1 Talento de Origem diferente, registrado normalmente na área de Talentos.",
  },
  {
    id: "mascara-das-muitas-faces",
    name: "Máscara das Muitas Faces",
    prerequisite: { minLevel: 2 },
    repeatable: false,
    summary: "Pode conjurar Disfarçar-se sem gastar espaço de magia (magia sempre disponível, origem: Máscara das Muitas Faces).",
  },
  {
    id: "mente-mistica",
    name: "Mente Mística",
    prerequisite: {},
    repeatable: false,
    summary: "Vantagem em salvaguardas de Constituição para manter Concentração em uma magia.",
  },
  {
    id: "mestre-das-infindaveis-formas",
    name: "Mestre das Infindáveis Formas",
    prerequisite: { minLevel: 5 },
    repeatable: false,
    summary: "Pode conjurar Alterar-se sem gastar espaço de magia (magia sempre disponível, origem: Mestre das Infindáveis Formas).",
  },
  {
    id: "olhar-de-duas-mentes",
    name: "Olhar de Duas Mentes",
    prerequisite: { minLevel: 5 },
    repeatable: false,
    summary:
      "Ação Bônus: toca uma criatura voluntária e percebe pelos sentidos dela até o fim do seu próximo turno (mantido com Ação Bônus em turnos seguintes), enquanto estiverem no mesmo plano; pode usar os sentidos especiais dela. Se estiverem a até 18m um do outro, pode conjurar magias como se estivesse no seu próprio espaço ou no espaço da criatura.",
  },
  {
    id: "pacto-da-corrente",
    name: "Pacto da Corrente",
    prerequisite: {},
    repeatable: false,
    summary:
      "Concede a magia Convocar Familiar (sempre disponível, sem espaço, origem: Pacto da Corrente), com formas especiais disponíveis (Cobra Peçonhenta, Diabrete, Esfinge Maravilhosa, Esqueleto, Pseudodragão, Quasit, Slaad Girino, Sprite) — a forma é escolhida ao conjurar, nunca uma decisão permanente do Builder. Ao usar a ação Atacar, pode renunciar a 1 dos seus ataques para que o familiar use a própria Reação e realize 1 ataque.",
  },
  {
    id: "pacto-da-lamina",
    name: "Pacto da Lâmina",
    prerequisite: {},
    repeatable: false,
    subChoice: { label: "Arma de pacto ATUAL (editável a qualquer momento — nunca uma escolha permanente)", required: false },
    summary:
      "Ação Bônus: conjura uma arma de pacto (corpo a corpo, Simples ou Marcial) na mão, ou cria um vínculo com uma arma mágica elegível. Enquanto vinculado: proficiência com a arma; a arma pode ser Foco de Conjuração; ataque e dano podem usar Carisma no lugar de Força/Destreza; o tipo de dano pode ser o normal da arma, Necrótico, Psíquico ou Radiante. A arma de pacto atual pode mudar durante o jogo — nunca uma limitação permanente da invocação.",
  },
  {
    id: "pacto-do-tomo",
    name: "Pacto do Tomo",
    prerequisite: {},
    repeatable: false,
    subChoice: { label: "Configuração ATUAL do Livro das Sombras (3 Truques + 2 magias de 1º círculo com Ritual) — editável a cada novo livro", required: false },
    summary:
      "Quando o Livro das Sombras é criado (após Descanso Curto ou Longo): escolhe 3 Truques e 2 magias de 1º círculo com a tag Ritual, de qualquer lista de classe, desde que não já estejam preparadas. Enquanto possuir o livro, essas magias ficam preparadas e contam como magias de Bruxo; o livro pode ser Foco de Conjuração. As escolhas podem mudar quando um novo livro é criado.",
  },
  {
    id: "passo-ascendente",
    name: "Passo Ascendente",
    prerequisite: { minLevel: 5 },
    repeatable: false,
    summary: "Pode conjurar Levitação em si mesmo, sem gastar espaço de magia (magia sempre disponível, origem: Passo Ascendente).",
  },
  {
    id: "presente-das-profundezas",
    name: "Presente das Profundezas",
    prerequisite: { minLevel: 5 },
    repeatable: false,
    summary:
      "Pode respirar debaixo d'água e ganha Deslocamento de Natação igual ao seu Deslocamento (efeitos permanentes). Também pode conjurar Respirar na Água em si mesmo 1 vez sem gastar espaço de magia, recuperando esse uso após Descanso Longo.",
  },
  {
    id: "presente-dos-protetores",
    name: "Presente dos Protetores",
    prerequisite: { minLevel: 9, requiresInvocationId: "pacto-do-tomo" },
    repeatable: false,
    summary:
      "O Livro das Sombras pode conter uma lista de nomes, em quantidade igual ao modificador de Carisma (mínimo 1). Quando uma criatura listada cairia a 0 PV sem morrer imediatamente, ela fica com 1 PV em vez disso. Depois de acionado, nenhuma criatura pode se beneficiar de novo até Descanso Longo.",
  },
  {
    id: "punicao-mistica",
    name: "Punição Mística",
    prerequisite: { minLevel: 5, requiresInvocationId: "pacto-da-lamina" },
    repeatable: false,
    summary:
      "1 vez por turno, ao acertar um ataque com sua arma de pacto, pode gastar 1 espaço de Magia de Pacto para causar 1d8 de dano Energético adicional, mais 1d8 por círculo do espaço gasto. Opcionalmente, se o alvo for Enorme ou menor, pode deixá-lo Caído.",
  },
  {
    id: "salto-sobrenatural",
    name: "Salto Sobrenatural",
    prerequisite: { minLevel: 2 },
    repeatable: false,
    summary: "Pode conjurar Salto em si mesmo, sem gastar espaço de magia (magia sempre disponível, origem: Salto Sobrenatural).",
  },
  {
    id: "sorvedouro-de-vida",
    name: "Sorvedouro de Vida",
    prerequisite: { minLevel: 9, requiresInvocationId: "pacto-da-lamina" },
    repeatable: false,
    summary:
      "1 vez por turno, ao acertar com sua arma de pacto, causa +1d6 de dano Necrótico, Psíquico ou Radiante (à escolha). Pode também gastar 1 Dado de Vida para curar: resultado do dado + modificador de Constituição, mínimo 1 PV.",
  },
  {
    id: "uno-com-as-sombras",
    name: "Uno com as Sombras",
    prerequisite: { minLevel: 5 },
    repeatable: false,
    summary:
      "Pode conjurar Invisibilidade em si mesmo, sem gastar espaço de magia, somente enquanto estiver em Meia-luz ou Escuridão (magia sempre disponível, origem: Uno com as Sombras).",
  },
  {
    id: "vigor-infero",
    name: "Vigor Ínfero",
    prerequisite: { minLevel: 2 },
    repeatable: false,
    summary:
      "Pode conjurar Vitalidade Vazia em si mesmo, sem gastar espaço de magia (magia sempre disponível, origem: Vigor Ínfero). Regra especial: nunca rola o dado de PV Temporários dessa magia — recebe automaticamente o valor máximo possível.",
  },
  {
    id: "visao-da-bruxa",
    name: "Visão da Bruxa",
    prerequisite: { minLevel: 15 },
    repeatable: false,
    summary: "Visão Verdadeira com alcance de 9m.",
  },
  {
    id: "visao-diabolica",
    name: "Visão Diabólica",
    prerequisite: { minLevel: 2 },
    repeatable: false,
    summary: "Vê normalmente em Meia-luz, Escuridão não mágica e Escuridão mágica, a até 36m.",
  },
  {
    id: "visoes-de-reinos-distantes",
    name: "Visões de Reinos Distantes",
    prerequisite: { minLevel: 9 },
    repeatable: false,
    summary: "Pode conjurar Olho Arcano sem gastar espaço de magia (magia sempre disponível, origem: Visões de Reinos Distantes).",
  },
  {
    id: "visoes-nebulosas",
    name: "Visões Nebulosas",
    prerequisite: { minLevel: 2 },
    repeatable: false,
    summary: "Pode conjurar Imagem Silenciosa sem gastar espaço de magia (magia sempre disponível, origem: Visões Nebulosas).",
  },
];

export const warlockInvocationsById: Record<string, InvocationDefinition> = Object.fromEntries(
  warlockInvocations.map((invocation) => [invocation.id, invocation]),
);
