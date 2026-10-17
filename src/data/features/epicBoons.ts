import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Catálogo das 12 Dádivas Épicas do PHB 2024 (fonte "IMPLEMENTAR
 * TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF") — categoria SEPARADA
 * dos 26 Talentos Gerais: só disponível pela característica "Dádiva
 * Épica" de nível 19 (`data/features/classes.ts#epicBoonFeatures`,
 * uma por classe das 12 confirmadas, nunca pelo Artífice — ver
 * `DADIVA_EPICA_CLASSES`), nunca por um nível de ASI. Nenhuma é
 * repetível, e o personagem só pode ter NO MÁXIMO uma Dádiva Épica
 * ativa (sem multiclasse no projeto, só existe uma concessão de nível
 * 19 por personagem).
 *
 * Todas as 12 concedem exatamente 1 escolha de "+1 num atributo até o
 * máximo 30" (`abilityScoreIncrease` — teto PRÓPRIO, nunca o teto 20
 * dos Talentos Gerais, ver `rules/abilities.ts#getEffectiveAbilityScore`),
 * com opções restritas para Recordação de Magia (INT/SAB/CAR) e Ataque
 * Irresistível (FOR/DEX) — as demais 10 aceitam qualquer um dos 6.
 * Dádiva da Proficiência em Perícia soma uma 2ª escolha
 * (`skillExpertise`, count 1) — as demais não têm escolha além do
 * atributo.
 *
 * Estas são as entradas-BASE do catálogo — cada uma representa "a
 * dádiva em si", nunca uma aquisição parametrizada: como só existe UMA
 * aquisição possível por personagem (ao contrário dos Talentos Gerais
 * repetíveis como Habilidoso/Iniciado em Magia), os ids de `choices`
 * aqui já são os ids REAIS usados em `character.featureChoiceSelections`
 * — nunca precisam da parametrização por `acquisitionKey` de
 * `rules/feats.ts#instantiateFeatAcquisition` (ver `rules/epicBoons.ts`).
 */

export const DADIVA_DA_FORTITUDE_FEAT_ID = "dadiva-da-fortitude";
export const DADIVA_DA_PROEZA_EM_COMBATE_FEAT_ID = "dadiva-da-proeza-em-combate";
export const DADIVA_DA_PROFICIENCIA_EM_PERICIA_FEAT_ID = "dadiva-da-proficiencia-em-pericia";
export const DADIVA_DA_RECORDACAO_DE_MAGIA_FEAT_ID = "dadiva-da-recordacao-de-magia";
export const DADIVA_DA_RECUPERACAO_FEAT_ID = "dadiva-da-recuperacao";
export const DADIVA_DA_RESISTENCIA_A_ENERGIA_FEAT_ID = "dadiva-da-resistencia-a-energia";
export const DADIVA_DA_VELOCIDADE_FEAT_ID = "dadiva-da-velocidade";
export const DADIVA_DA_VIAGEM_DIMENSIONAL_FEAT_ID = "dadiva-da-viagem-dimensional";
export const DADIVA_DA_VISAO_VERDADEIRA_FEAT_ID = "dadiva-da-visao-verdadeira";
export const DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID = "dadiva-do-ataque-irresistivel";
export const DADIVA_DO_DESTINO_FEAT_ID = "dadiva-do-destino";
export const DADIVA_DO_ESPIRITO_DA_NOITE_FEAT_ID = "dadiva-do-espirito-da-noite";

/** Id-BASE da `FeatureChoice` de "Especialização em 1 perícia" de Dádiva da Proficiência em Perícia — única dádiva com 2ª escolha além do atributo. */
export const DADIVA_DA_PROFICIENCIA_EM_PERICIA_EXPERTISE_CHOICE_ID = `${DADIVA_DA_PROFICIENCIA_EM_PERICIA_FEAT_ID}-especializacao`;

const ALL_ABILITIES = ["FOR", "DEX", "CON", "INT", "SAB", "CAR"] as const;

export const epicBoons: FeatureDefinition[] = [
  {
    id: DADIVA_DA_FORTITUDE_FEAT_ID,
    name: "Dádiva da Fortitude",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Saúde Fortalecida: PV máximo aumenta em 40, aplicado uma ÚNICA vez (nunca por nível), somado a todas as outras fontes de PV (rules/hp.ts#getMaxHitPoints) — se o atributo escolhido nesta própria dádiva for Constituição, o bônus de PV das regras normais de CON também se aplica, SEPARADO deste +40 fixo. Recuperação Fortalecida: sempre que recuperar PV por qualquer meio, recupera PV adicionais iguais ao modificador ATUAL de Constituição (nunca limitado a cura por magia, nunca aplicado a PV Temporários, nunca soma por dado dentro da mesma recuperação) — depois de usar, só pode usar de novo no início do próximo turno do personagem (não é 'uma vez por turno de qualquer criatura', é um bloqueio até o PRÓPRIO próximo turno). +1 num atributo à escolha, até o máximo 30.",
    choices: [
      { id: `${DADIVA_DA_FORTITUDE_FEAT_ID}-atributo`, prompt: "Dádiva da Fortitude — aumente em 1 (máx. 30): qualquer atributo", effect: { kind: "abilityScoreIncrease", options: [...ALL_ABILITIES] } },
    ],
  },
  {
    id: DADIVA_DA_PROEZA_EM_COMBATE_FEAT_ID,
    name: "Dádiva da Proeza em Combate",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Ao errar uma jogada de ataque (qualquer uma — corpo a corpo, à distância, com arma, Ataque Desarmado ou de magia), pode transformá-la em acerto — nunca exige Reação, nunca é uma nova rolagem, nunca eleva o resultado a 20 nem conta como Acerto Crítico. Depois de usar, só pode usar de novo no início do próximo turno do personagem — nunca um uso por descanso, nunca reutilizável antes desse marco. +1 num atributo à escolha, até o máximo 30.",
    choices: [
      {
        id: `${DADIVA_DA_PROEZA_EM_COMBATE_FEAT_ID}-atributo`,
        prompt: "Dádiva da Proeza em Combate — aumente em 1 (máx. 30): qualquer atributo",
        effect: { kind: "abilityScoreIncrease", options: [...ALL_ABILITIES] },
      },
    ],
  },
  {
    id: DADIVA_DA_PROFICIENCIA_EM_PERICIA_FEAT_ID,
    name: "Dádiva da Proficiência em Perícia",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Concede proficiência em TODAS as perícias (rules/skills.ts#isSkillGrantedByEpicBoon, somada em getSkillProficiency/getSkillProficiencyOrigin) — nunca proficiência ou Especialização em ferramentas. Como as proficiências desta própria dádiva já tornam qualquer perícia elegível, concede também 1 escolha de Especialização numa perícia proficiente ainda sem Especialização (reaproveita o controle genérico de `skillExpertise` — nenhuma perícia fica fora por falta de opções, já que todas estão proficientes). Preserva Especializações e proficiências já concedidas por outras origens, sem exigir nova escolha nem duplicar. +1 num atributo à escolha, até o máximo 30.",
    choices: [
      {
        id: DADIVA_DA_PROFICIENCIA_EM_PERICIA_EXPERTISE_CHOICE_ID,
        prompt: "Dádiva da Proficiência em Perícia — Especialização em 1 perícia proficiente",
        effect: { kind: "skillExpertise", count: 1 },
      },
      {
        id: `${DADIVA_DA_PROFICIENCIA_EM_PERICIA_FEAT_ID}-atributo`,
        prompt: "Dádiva da Proficiência em Perícia — aumente em 1 (máx. 30): qualquer atributo",
        effect: { kind: "abilityScoreIncrease", options: [...ALL_ABILITIES] },
      },
    ],
  },
  {
    id: DADIVA_DA_RECORDACAO_DE_MAGIA_FEAT_ID,
    name: "Dádiva da Recordação de Magia",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Exige possuir a característica Conjuração (rules/epicBoons.ts#hasConjuracaoFeature — nunca satisfeito só por possuir qualquer magia, e nunca satisfeito só por Magia de Pacto do Bruxo, que é uma característica própria e diferente) — por isso só aparece como opção elegível na escolha de Dádiva Épica quando o personagem já tem Conjuração por classe ou subclasse. Sempre que conjurar uma magia usando um espaço de 1º a 4º círculo, joga 1d4; se o resultado for IGUAL ao círculo do espaço usado (nunca ao círculo original da magia), esse espaço não é gasto. Nunca se aplica a espaços de 5º círculo ou superior, nem a conjuração que não gasta espaço; nunca concede espaços adicionais; nunca tem contador por descanso — é um resultado aleatório a cada conjuração elegível, não uma conjuração gratuita marcável. +1 em Inteligência, Sabedoria ou Carisma, até o máximo 30.",
    choices: [
      {
        id: `${DADIVA_DA_RECORDACAO_DE_MAGIA_FEAT_ID}-atributo`,
        prompt: "Dádiva da Recordação de Magia — aumente em 1 (máx. 30): Inteligência, Sabedoria ou Carisma",
        effect: { kind: "abilityScoreIncrease", options: ["INT", "SAB", "CAR"] },
      },
    ],
  },
  {
    id: DADIVA_DA_RECUPERACAO_FEAT_ID,
    name: "Dádiva da Recuperação",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Até a Morte: ao ser reduzido a 0 PV, pode optar por ficar com 1 PV em vez de cair a 0, e em seguida recupera PV iguais à METADE do PV máximo ATUAL (arredondado para baixo, igual ao arredondamento já usado no resto do projeto) — as duas partes são distintas (nunca 'simplesmente fica com metade do PV máximo'); 1 uso por Descanso Longo. Recuperar Vitalidade: reserva PRÓPRIA e independente de 10 d10 (nunca usa nem compartilha os Dados de Vida da classe) — como Ação Bônus, escolhe quantos desses d10 ainda disponíveis gastar, joga todos e recupera PV iguais à soma; nunca soma o modificador de Constituição a este resultado. Recupera TODOS os d10 da reserva em Descanso Longo. +1 num atributo à escolha, até o máximo 30.",
    choices: [
      {
        id: `${DADIVA_DA_RECUPERACAO_FEAT_ID}-atributo`,
        prompt: "Dádiva da Recuperação — aumente em 1 (máx. 30): qualquer atributo",
        effect: { kind: "abilityScoreIncrease", options: [...ALL_ABILITIES] },
      },
    ],
  },
  {
    id: DADIVA_DA_RESISTENCIA_A_ENERGIA_FEAT_ID,
    name: "Dádiva da Resistência à Energia",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Resistências à Energia: Resistência a 2 tipos de dano diferentes, escolhidos entre Ácido, Elétrico, Frio, Fogo, Necrótico, Psíquico, Radiante, Trovão e Venenoso (nunca Energético, Concussivo, Cortante ou Perfurante) — decisão OPERACIONAL, tomada e trocável a cada Descanso Longo, nunca uma escolha permanente do Builder nem fixada no PDF (mesmo tratamento de Maestria em Arma/Resistência Ínfera: o jogador decide durante o jogo). Redirecionamento de Energia: quando sofrer dano de um dos 2 tipos escolhidos nesta dádiva, pode usar a Reação para escolher outra criatura à vista a até 18m, sem Cobertura Total — ela faz uma salvaguarda de Destreza (CD 8 + mod. Constituição + Bônus de Proficiência); se falhar, sofre 2d12 + mod. Constituição de dano do MESMO tipo que desencadeou a Reação. Nunca depende de o dano sofrido ser igual ao valor redirecionado, nunca anula o dano que o personagem sofreu, nunca causa metade do dano em caso de sucesso, nunca tem uso limitado por descanso. +1 num atributo à escolha, até o máximo 30.",
    choices: [
      {
        id: `${DADIVA_DA_RESISTENCIA_A_ENERGIA_FEAT_ID}-atributo`,
        prompt: "Dádiva da Resistência à Energia — aumente em 1 (máx. 30): qualquer atributo",
        effect: { kind: "abilityScoreIncrease", options: [...ALL_ABILITIES] },
      },
    ],
  },
  {
    id: DADIVA_DA_VELOCIDADE_FEAT_ID,
    name: "Dádiva da Velocidade",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Agilidade: Deslocamento aumenta em 9m, aplicado uma ÚNICA vez e somado a todas as outras fontes de Deslocamento (rules/speed.ts). Artista de Fuga: como Ação Bônus, pode usar a ação Desengajar; ao fazê-lo, a condição Imobilizado também é encerrada no personagem — nunca exige teste, nunca é um uso limitado por descanso. +1 num atributo à escolha, até o máximo 30.",
    choices: [
      { id: `${DADIVA_DA_VELOCIDADE_FEAT_ID}-atributo`, prompt: "Dádiva da Velocidade — aumente em 1 (máx. 30): qualquer atributo", effect: { kind: "abilityScoreIncrease", options: [...ALL_ABILITIES] } },
    ],
  },
  {
    id: DADIVA_DA_VIAGEM_DIMENSIONAL_FEAT_ID,
    name: "Dádiva da Viagem Dimensional",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Imediatamente após executar a ação Atacar ou Usar Magia POR COMPLETO (o gatilho é concluir a ação elegível, nunca cada ataque individual dentro dela), pode se teleportar até 9m para um espaço desocupado à vista — nunca exige Ação Bônus ou Reação, nunca tem reserva por descanso, nunca limitado a uma vez por turno (o texto não estabelece esse limite), nunca ativado por qualquer Ação Bônus/Reação só porque envolve ataque ou magia. Nunca exige escolher um destino fixo com antecedência. +1 num atributo à escolha, até o máximo 30.",
    choices: [
      {
        id: `${DADIVA_DA_VIAGEM_DIMENSIONAL_FEAT_ID}-atributo`,
        prompt: "Dádiva da Viagem Dimensional — aumente em 1 (máx. 30): qualquer atributo",
        effect: { kind: "abilityScoreIncrease", options: [...ALL_ABILITIES] },
      },
    ],
  },
  {
    id: DADIVA_DA_VISAO_VERDADEIRA_FEAT_ID,
    name: "Dádiva da Visão Verdadeira",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Concede Visão Verdadeira em um raio de 18m — preserva outros sentidos já concedidos por outras fontes, nunca soma alcances de Visão Verdadeira sem regra própria que autorize. Sem campo de Sentidos no PDF (mesma lacuna estrutural das demais origens de sentido do projeto): impressa como texto na caixa Talentos. +1 num atributo à escolha, até o máximo 30.",
    choices: [
      {
        id: `${DADIVA_DA_VISAO_VERDADEIRA_FEAT_ID}-atributo`,
        prompt: "Dádiva da Visão Verdadeira — aumente em 1 (máx. 30): qualquer atributo",
        effect: { kind: "abilityScoreIncrease", options: [...ALL_ABILITIES] },
      },
    ],
  },
  {
    id: DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID,
    name: "Dádiva do Ataque Irresistível",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Superar Defesas: todo dano Concussivo, Cortante e Perfurante causado pelo personagem ignora Resistência (nunca limitado a ataques com arma, nunca ignora Imunidade). Golpe Devastador: ao tirar 20 natural no d20 de uma jogada de ataque, causa dano adicional igual ao VALOR ATUAL do atributo aumentado por esta própria dádiva (Força ou Destreza, conforme a escolha feita abaixo — nunca o modificador, nunca escolhido automaticamente entre os dois, nunca somado de novo como se fosse um dado extra de Acerto Crítico), do mesmo tipo do ataque — nunca ativa com 18 ou 19 mesmo com Crítico Superior, e nunca se torna um bônus permanente de todos os ataques. +1 em Força ou Destreza, até o máximo 30 — este é o MESMO atributo usado por Golpe Devastador.",
    choices: [
      {
        id: `${DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID}-atributo`,
        prompt: "Dádiva do Ataque Irresistível — aumente em 1 (máx. 30): Força ou Destreza",
        effect: { kind: "abilityScoreIncrease", options: ["FOR", "DEX"] },
      },
    ],
  },
  {
    id: DADIVA_DO_DESTINO_FEAT_ID,
    name: "Dádiva do Destino",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Quando o personagem OU outra criatura a até 18m dele passar ou falhar em um Teste de D20 (teste de atributo, jogada de ataque ou salvaguarda), pode jogar 2d4 e aplicar a soma como bônus OU penalidade a essa jogada — pode ser usada depois de já saber se o resultado foi sucesso ou falha, nunca exige Reação, nunca substitui o d20 em si, e os 2 dados nunca são divididos entre jogadas ou criaturas diferentes. Um ÚNICO uso por vez: recupera ao rolar Iniciativa, ao completar um Descanso Curto ou ao completar um Descanso Longo — qualquer um desses 3 eventos restaura o uso já existente, nunca acumula usos extras. +1 num atributo à escolha, até o máximo 30.",
    choices: [
      { id: `${DADIVA_DO_DESTINO_FEAT_ID}-atributo`, prompt: "Dádiva do Destino — aumente em 1 (máx. 30): qualquer atributo", effect: { kind: "abilityScoreIncrease", options: [...ALL_ABILITIES] } },
    ],
  },
  {
    id: DADIVA_DO_ESPIRITO_DA_NOITE_FEAT_ID,
    name: "Dádiva do Espírito da Noite",
    sourceType: "feat",
    level: null,
    autoGranted: true,
    summary:
      "Nível 19+ (Dádiva Épica). Fundir-se com Sombras: enquanto estiver em área de Meia-luz ou Escuridão, pode usar Ação Bônus para ficar Invisível; a condição termina imediatamente depois que o personagem executa uma ação, uma Ação Bônus OU uma Reação subsequente (nunca limitado a atacar/causar dano/conjurar magia, e a PRÓPRIA Ação Bônus de ativação nunca encerra a invisibilidade que ela mesma concede) — sem duração fixa nem uso limitado por descanso além dessa condição de encerramento. Forma Sombria: enquanto estiver em Meia-luz ou Escuridão, tem Resistência a todos os tipos de dano, EXCETO Psíquico e Radiante — nunca exige estar Invisível para este benefício, nunca se aplica fora dessas condições de iluminação. +1 num atributo à escolha, até o máximo 30.",
    choices: [
      {
        id: `${DADIVA_DO_ESPIRITO_DA_NOITE_FEAT_ID}-atributo`,
        prompt: "Dádiva do Espírito da Noite — aumente em 1 (máx. 30): qualquer atributo",
        effect: { kind: "abilityScoreIncrease", options: [...ALL_ABILITIES] },
      },
    ],
  },
];

export const EPIC_BOON_NAMES: string[] = epicBoons.map((boon) => boon.name);

export const epicBoonsById: Record<string, FeatureDefinition> = Object.fromEntries(epicBoons.map((boon) => [boon.id, boon]));

export const epicBoonsByName: Record<string, FeatureDefinition> = Object.fromEntries(epicBoons.map((boon) => [boon.name, boon]));
