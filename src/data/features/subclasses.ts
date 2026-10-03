import type { FeatureDefinition } from "../../domain/features.js";
import { CONHECIMENTO_PROFICIENCIAS_BONUS_CHOICE_ID } from "./bard.js";

/**
 * Terreno do Círculo da Terra (Druida, nível 3+) — escolha duradoura
 * armazenada em `featureChoiceSelections` como qualquer `FeatureChoice`
 * genérica, mas resolvida por uma etapa PRÓPRIA do Builder
 * (`ui/builder/steps/StepEarthCircleTerrain.tsx`), nunca pela etapa
 * genérica "Características e Talentos" — por isso a `FeatureDefinition`
 * abaixo não tem `choices`: evita que ela apareça duplicada em duas
 * etapas. Primeira aplicação da regra arquitetural do §21 da fonte
 * "INTEGRAÇÃO COMPLETA — DRUIDA E SUBCLASSES": uma escolha de subclasse
 * duradoura que altera várias partes da ficha (magias, resistência)
 * ganha etapa condicional própria.
 */
export const EARTH_CIRCLE_TERRAIN_CHOICE_ID = "druida-terra-terreno-escolha";
export const EARTH_CIRCLE_TERRAIN_OPTIONS = ["Árido", "Polar", "Temperado", "Tropical"] as const;
export type EarthCircleTerrain = (typeof EARTH_CIRCLE_TERRAIN_OPTIONS)[number];

/**
 * Features de SUBCLASSE confirmadas com fonte fornecida — as 4
 * subclasses do Bárbaro ("INTEGRAÇÃO COMPLETA — BÁRBARO E SUBCLASSES")
 * e as 4 subclasses do Bardo ("INTEGRAÇÃO COMPLETA — BARDO E
 * SUBCLASSES"). As demais ~25 subclasses do projeto continuam sem
 * conteúdo (ver `getSubclassFeatures`, que já filtra por
 * `subclassFullName` + nível e não precisa mudar quando chegarem).
 * "Colégio dos Espíritos" (5ª subclasse de Bardo já cadastrada em
 * `data/subclasses.ts`) fica de fora — fora do escopo desta fonte.
 *
 * Escolhas tomadas DURANTE O JOGO (a cada ativação de Fúria, ou a cada
 * vez que o efeito ocorre) NÃO viram `FeatureChoice` do Builder — só
 * texto informativo no `summary` — por decisão explícita da fonte
 * (§22: "não são decisões permanentes do Builder"): Fúria dos
 * Selvagens, Poder dos Selvagens, tipo de dano da Fúria Divina,
 * efeitos do Golpe Brutal (este já tratado em `data/features/barbarian.ts`).
 * A única escolha realmente permanente aqui é "Aspecto dos Selvagens"
 * (Coração Selvagem, nível 6) — fica guardada no Character e pode ser
 * trocada depois de Descanso Longo (reaproveitando a mesma
 * `FeatureChoice`/seleção; não há ainda um fluxo de "refazer escolha"
 * dedicado, mas o Builder permite reabrir a etapa normalmente).
 */
export const subclassFeatures: FeatureDefinition[] = [
  // ---------- Caminho da Árvore do Mundo ----------
  {
    id: "barbaro-arvore-do-mundo-vitalidade-da-arvore-3",
    name: "Vitalidade da Árvore",
    sourceType: "subclass",
    subclassFullName: "Caminho da Árvore do Mundo",
    level: 3,
    autoGranted: true,
    summary:
      "Surto de Vitalidade: ao ativar Fúria, ganhe PV Temp. = nível de Bárbaro. Força Revigorante: início de cada turno em Fúria, outra criatura a 3m ganha PV Temp. = Dano da Fúria em d6 (desaparecem quando a Fúria termina).",
  },
  {
    id: "barbaro-arvore-do-mundo-ramos-da-arvore-6",
    name: "Ramos da Árvore",
    sourceType: "subclass",
    subclassFullName: "Caminho da Árvore do Mundo",
    level: 6,
    autoGranted: true,
    summary:
      "Em Fúria, Reação quando uma criatura visível inicia o turno a até 9m: Salv. FOR CD 8+FOR+Prof.; falha → teleporta-a para espaço livre até 1,5m de você (ou o mais perto possível); pode reduzir o Deslocamento dela a 0 até o fim do turno.",
  },
  {
    id: "barbaro-arvore-do-mundo-raizes-devastadoras-10",
    name: "Raízes Devastadoras",
    sourceType: "subclass",
    subclassFullName: "Caminho da Árvore do Mundo",
    level: 10,
    autoGranted: true,
    summary:
      "No seu turno, armas corpo a corpo Pesadas ou Versáteis ganham +3m de alcance; ao acertar, pode usar Derrubar ou Empurrar além da Maestria normal da arma.",
  },
  {
    id: "barbaro-arvore-do-mundo-percorrer-a-arvore-14",
    name: "Percorrer a Árvore",
    sourceType: "subclass",
    subclassFullName: "Caminho da Árvore do Mundo",
    level: 14,
    autoGranted: true,
    summary:
      "Ao ativar Fúria, ou como Ação Bônus durante ela: teleporte de 18m para espaço desocupado visível. 1×/Fúria: alcance 45m, levando até 6 criaturas voluntárias a até 3m (sem checkbox diário — é 1 vez por Fúria, não por Descanso Longo).",
  },

  // ---------- Caminho do Berserker ----------
  {
    id: "barbaro-berserker-frenesi-3",
    name: "Frenesi",
    sourceType: "subclass",
    subclassFullName: "Caminho do Berserker",
    level: 3,
    autoGranted: true,
    summary:
      "Em Fúria + Ataque Imprudente, o 1º alvo acertado no turno com arma ou Ataque Desarmado baseado em Força sofre dano adicional igual ao Dano da Fúria em d6, do mesmo tipo do ataque.",
  },
  {
    id: "barbaro-berserker-furia-irracional-6",
    name: "Fúria Irracional",
    sourceType: "subclass",
    subclassFullName: "Caminho do Berserker",
    level: 6,
    autoGranted: true,
    summary: "Durante a Fúria: Imunidade a Amedrontado e Enfeitiçado; ao entrar em Fúria, encerra essas condições se já estiverem ativas.",
  },
  {
    id: "barbaro-berserker-retaliacao-10",
    name: "Retaliação",
    sourceType: "subclass",
    subclassFullName: "Caminho do Berserker",
    level: 10,
    autoGranted: true,
    summary: "Ao sofrer dano de uma criatura a até 1,5m, Reação: 1 ataque corpo a corpo (arma ou Ataque Desarmado) contra ela.",
  },
  {
    id: "barbaro-berserker-presenca-intimidante-14",
    name: "Presença Intimidante",
    sourceType: "subclass",
    subclassFullName: "Caminho do Berserker",
    level: 14,
    autoGranted: true,
    summary:
      "Ação Bônus: criaturas escolhidas numa Emanação de 9m fazem Salv. SAB CD 8+FOR+Prof.; falha → Amedrontado por 1 min, repetindo a salvaguarda ao fim de cada turno. 1×/Descanso Longo; recupera gastando 1 uso de Fúria (sem ação).",
  },

  // ---------- Caminho do Coração Selvagem ----------
  {
    id: "barbaro-coracao-selvagem-arauto-da-fauna-3",
    name: "Arauto da Fauna",
    sourceType: "subclass",
    subclassFullName: "Caminho do Coração Selvagem",
    level: 3,
    autoGranted: true,
    summary:
      "Concede, só como Ritual (atributo SAB, nunca consome espaço de magia): Falar com Animais e Sentido Feral — aparecem na área de Magias, nunca neste campo (rules/barbarianRitualSpells.ts).",
  },
  {
    id: "barbaro-coracao-selvagem-furia-dos-selvagens-3",
    name: "Fúria dos Selvagens",
    sourceType: "subclass",
    subclassFullName: "Caminho do Coração Selvagem",
    level: 3,
    autoGranted: true,
    summary:
      "Escolha feita a cada ativação de Fúria (não é decisão permanente do Builder): Águia (Correr+Desengajar na AB de ativação; depois, AB em Fúria permite ambos), Lobo (aliados têm Vantagem em ataques contra inimigos seus a até 1,5m dele) ou Urso (Resistência a todo dano exceto Energético/Necrótico/Psíquico/Radiante).",
  },
  {
    id: "barbaro-coracao-selvagem-aspecto-dos-selvagens-6",
    name: "Aspecto dos Selvagens",
    sourceType: "subclass",
    subclassFullName: "Caminho do Coração Selvagem",
    level: 6,
    autoGranted: false,
    summary:
      "Escolha Coruja (Visão no Escuro 18m, ou +18m se já tiver), Pantera (Deslocamento de Escalada = Deslocamento) ou Salmão (Deslocamento de Natação = Deslocamento). Pode trocar após Descanso Longo.",
    choices: [
      {
        id: "barbaro-aspecto-dos-selvagens-escolha",
        prompt: "Aspecto dos Selvagens",
        effect: { kind: "optionPick", options: ["Coruja", "Pantera", "Salmão"] },
      },
    ],
  },
  {
    id: "barbaro-coracao-selvagem-arauto-da-natureza-10",
    name: "Arauto da Natureza",
    sourceType: "subclass",
    subclassFullName: "Caminho do Coração Selvagem",
    level: 10,
    autoGranted: true,
    summary: "Concede, só como Ritual (SAB): Comunhão com a Natureza — aparece na área de Magias, nunca neste campo.",
  },
  {
    id: "barbaro-coracao-selvagem-poder-dos-selvagens-14",
    name: "Poder dos Selvagens",
    sourceType: "subclass",
    subclassFullName: "Caminho do Coração Selvagem",
    level: 14,
    autoGranted: true,
    summary:
      "Escolha feita a cada ativação de Fúria (não é decisão permanente do Builder): Carneiro (ao acertar ataque corpo a corpo, pode deixar criatura Grande ou menor Caída), Falcão (Deslocamento de Voo = Deslocamento, só sem armadura) ou Leão (inimigos a 1,5m têm Desvantagem em ataques contra outros alvos que não você ou outro Bárbaro com esta opção ativa).",
  },

  // ---------- Caminho do Fanático ----------
  {
    id: "barbaro-fanatico-campeao-dos-deuses-3",
    name: "Campeão dos Deuses",
    sourceType: "subclass",
    subclassFullName: "Caminho do Fanático",
    level: 3,
    autoGranted: true,
    summary:
      "Reserva de dados d12 (4 nos níveis 3–5, 5 nos 6–11, 6 nos 12–16, 7 nos 17–20 — rules/classResources.ts). Ação Bônus: gaste quaisquer dados disponíveis; cure PV = total rolado. Recupera todos após Descanso Longo.",
  },
  {
    id: "barbaro-fanatico-furia-divina-3",
    name: "Fúria Divina",
    sourceType: "subclass",
    subclassFullName: "Caminho do Fanático",
    level: 3,
    autoGranted: true,
    summary:
      "Em Fúria, o 1º alvo acertado em cada turno com arma ou Ataque Desarmado sofre +1d6 + metade do nível de Bárbaro (arredondado para baixo), Necrótico ou Radiante à escolha a cada vez.",
  },
  {
    id: "barbaro-fanatico-concentracao-fanatica-6",
    name: "Concentração Fanática",
    sourceType: "subclass",
    subclassFullName: "Caminho do Fanático",
    level: 6,
    autoGranted: true,
    summary: "1×/Fúria, ao falhar numa salvaguarda: repita a rolagem somando o Dano da Fúria; use o novo resultado (sem checkbox diário).",
  },
  {
    id: "barbaro-fanatico-presenca-zelosa-10",
    name: "Presença Zelosa",
    sourceType: "subclass",
    subclassFullName: "Caminho do Fanático",
    level: 10,
    autoGranted: true,
    summary:
      "Ação Bônus: até 10 outras criaturas a até 18m ganham Vantagem em ataques e salvaguardas até o início do seu próximo turno. 1×/Descanso Longo; recupera gastando 1 uso de Fúria (sem ação).",
  },
  {
    id: "barbaro-fanatico-furia-dos-deuses-14",
    name: "Fúria dos Deuses",
    sourceType: "subclass",
    subclassFullName: "Caminho do Fanático",
    level: 14,
    autoGranted: true,
    summary:
      "Ao ativar Fúria, assume forma divina por 1 minuto ou até cair a 0 PV (1×/Descanso Longo): Resistência a Necrótico/Psíquico/Radiante; Reação — criatura a até 9m que cairia a 0 PV: gaste 1 uso de Fúria, PV dela = seu nível de Bárbaro; Deslocamento de Voo = Deslocamento, podendo pairar.",
  },

  // ---------- Colégio da Bravura ----------
  {
    id: "bardo-bravura-inspiracao-em-combate-3",
    name: "Inspiração em Combate",
    sourceType: "subclass",
    subclassFullName: "Colégio da Bravura",
    level: 3,
    autoGranted: true,
    summary:
      "Não cria novos usos — usa o dado de Inspiração de Bardo que a criatura já recebeu. Defensivo: Reação ao ser atingido por ataque, rola o dado e soma à própria CA contra aquele ataque. Ofensivo: imediatamente após acertar um ataque, rola o dado e soma ao dano. Escolha feita a cada uso, não é decisão permanente do Builder.",
  },
  {
    id: "bardo-bravura-treinamento-marcial-3",
    name: "Treinamento Marcial",
    sourceType: "subclass",
    subclassFullName: "Colégio da Bravura",
    level: 3,
    autoGranted: true,
    summary:
      "Proficiência em Armas Marciais, Armaduras Médias e Escudos (aplicado automaticamente em Proficiências/Armaduras — ver state/characterStore.ts#setSubclass). Uma arma Simples ou Marcial pode servir de Foco de Conjuração de Bardo.",
  },
  {
    id: "bardo-bravura-ataque-extra-6",
    name: "Ataque Extra",
    sourceType: "subclass",
    subclassFullName: "Colégio da Bravura",
    level: 6,
    autoGranted: true,
    summary:
      "2 ataques ao usar a ação Atacar. 1 desses ataques pode ser substituído por 1 Truque com tempo de conjuração de 1 ação.",
  },
  {
    id: "bardo-bravura-magia-de-batalha-14",
    name: "Magia de Batalha",
    sourceType: "subclass",
    subclassFullName: "Colégio da Bravura",
    level: 14,
    autoGranted: true,
    summary: "Após conjurar uma magia com tempo de conjuração de 1 ação, pode realizar 1 ataque com arma como Ação Bônus.",
  },

  // ---------- Colégio da Dança ----------
  {
    id: "bardo-danca-ginga-fascinante-3",
    name: "Ginga Fascinante",
    sourceType: "subclass",
    subclassFullName: "Colégio da Dança",
    level: 3,
    autoGranted: true,
    summary:
      "Todos os benefícios exigem estar sem armadura e sem escudo. Dança Virtuosa: Vantagem em testes de CAR (Atuação) envolvendo dança. Dano de Bardo: Ataque Desarmado pode usar DES no lugar de FOR para o ataque; dano = dado de Inspiração de Bardo + mod. DES, Contundente (não gasta dado de Inspiração — aplicado automaticamente nos Ataques). Defesa sem Armadura: CA = 10 + DES + CAR sem armadura/escudo (aplicado automaticamente em rules/armor.ts). Golpes Ágeis: ao gastar 1 uso de Inspiração como parte de uma ação, Ação Bônus ou Reação, pode realizar 1 Ataque Desarmado como parte da mesma ação.",
  },
  {
    id: "bardo-danca-gingado-coordenado-6",
    name: "Gingado Coordenado",
    sourceType: "subclass",
    subclassFullName: "Colégio da Dança",
    level: 6,
    autoGranted: true,
    summary:
      "Ao rolar Iniciativa, gaste 1 uso de Inspiração (se não estiver Incapacitado): role o dado de Inspiração; você e cada aliado a até 9m que possa ver/ouvir somam o resultado à própria Iniciativa.",
  },
  {
    id: "bardo-danca-movimento-inspirador-6",
    name: "Movimento Inspirador",
    sourceType: "subclass",
    subclassFullName: "Colégio da Dança",
    level: 6,
    autoGranted: true,
    summary:
      "Reação (custo: 1 Inspiração) quando um inimigo visível encerra o turno a até 1,5m: mova até ½ do Deslocamento. Depois, 1 aliado escolhido a até 9m pode usar sua própria Reação para mover até ½ do Deslocamento dele. Nenhum desses movimentos provoca Ataque de Oportunidade.",
  },
  {
    id: "bardo-danca-evasao-liderada-14",
    name: "Evasão Liderada",
    sourceType: "subclass",
    subclassFullName: "Colégio da Dança",
    level: 14,
    autoGranted: true,
    summary:
      "Quando um efeito permite Salvaguarda de DES para metade do dano: sucesso = 0 dano, falha = metade do dano. Criaturas a até 1,5m que também façam a salvaguarda podem receber o mesmo benefício. Não funciona se o Bardo estiver Incapacitado.",
  },

  // ---------- Colégio do Conhecimento ----------
  {
    id: "bardo-conhecimento-palavras-de-interrupcao-3",
    name: "Palavras de Interrupção",
    sourceType: "subclass",
    subclassFullName: "Colégio do Conhecimento",
    level: 3,
    autoGranted: true,
    summary:
      "Reação (custo: 1 Inspiração de Bardo) quando uma criatura visível a até 18m faz uma jogada de dano, ou tem sucesso em um teste de atributo ou em um ataque: role o dado de Inspiração e subtraia o resultado da jogada da criatura.",
  },
  {
    id: "bardo-conhecimento-proficiencias-bonus-3",
    name: "Proficiências Bônus",
    sourceType: "subclass",
    subclassFullName: "Colégio do Conhecimento",
    level: 3,
    autoGranted: false,
    summary:
      "Escolha 3 perícias (não limitado à lista normal de perícias do Bardo) — proficiência aplicada direto em Perícias/PDF, nunca repetida aqui.",
    choices: [
      {
        id: CONHECIMENTO_PROFICIENCIAS_BONUS_CHOICE_ID,
        prompt: "Proficiências Bônus — escolha 3 perícias",
        effect: { kind: "skillProficiency", options: "any", count: 3 },
      },
    ],
  },
  {
    id: "bardo-conhecimento-descobertas-magicas-6",
    name: "Descobertas Mágicas",
    sourceType: "subclass",
    subclassFullName: "Colégio do Conhecimento",
    level: 6,
    autoGranted: true,
    summary:
      "Escolha 2 magias (Truques ou de um círculo para o qual tenha espaço) das listas de Clérigo, Druida ou Mago — ficam sempre preparadas, sem contar no limite normal de Magias Preparadas. Ao subir de nível de Bardo, pode substituir uma delas por outra válida dessas listas. Sem catálogo estruturado de magias no projeto: a escolha é feita na lista manual de Magias Preparadas da área de Magias (Character.spellsPrepared), nunca neste campo.",
  },
  {
    id: "bardo-conhecimento-pericia-inigualavel-14",
    name: "Perícia Inigualável",
    sourceType: "subclass",
    subclassFullName: "Colégio do Conhecimento",
    level: 14,
    autoGranted: true,
    summary:
      "Ao falhar em um teste de atributo ou em uma jogada de ataque, pode gastar 1 Inspiração: role o dado de Inspiração e some ao d20. Se ainda assim falhar, o uso de Inspiração NÃO é gasto.",
  },

  // ---------- Colégio do Glamour ----------
  {
    id: "bardo-glamour-magia-fascinante-3",
    name: "Magia Fascinante",
    sourceType: "subclass",
    subclassFullName: "Colégio do Glamour",
    level: 3,
    autoGranted: true,
    summary:
      "Enfeitiçar Pessoa e Reflexos ficam sempre preparadas (entram automaticamente na área de Magias, rules/bardAutoPreparedSpells.ts — nunca neste campo). Efeito próprio: imediatamente após conjurar uma magia de Encantamento ou Ilusão usando um espaço de magia, 1 criatura visível a até 18m faz Salv. SAB contra sua CD de magia; falha → Amedrontado ou Enfeitiçado (à escolha) por 1 minuto, repetindo a salvaguarda ao fim de cada turno. Uso gratuito: 1×/Descanso Longo; recuperação alternativa: gastar 1 Inspiração de Bardo (nenhuma ação).",
  },
  {
    id: "bardo-glamour-manto-de-inspiracao-3",
    name: "Manto de Inspiração",
    sourceType: "subclass",
    subclassFullName: "Colégio do Glamour",
    level: 3,
    autoGranted: true,
    summary:
      "Ação Bônus (custo: 1 Inspiração): role o dado de Inspiração; até modificador de CAR (mínimo 1) criaturas a até 18m recebem PV Temporários = 2× o resultado do dado. Cada uma pode usar sua Reação para mover até o Deslocamento máximo, sem provocar Ataque de Oportunidade.",
  },
  {
    id: "bardo-glamour-manto-de-majestade-6",
    name: "Manto de Majestade",
    sourceType: "subclass",
    subclassFullName: "Colégio do Glamour",
    level: 6,
    autoGranted: true,
    summary:
      "Comando fica sempre preparada (entra automaticamente na área de Magias, rules/bardAutoPreparedSpells.ts). Ação Bônus: conjura Comando sem gastar espaço e assume forma sobrenatural por 1 minuto ou até a Concentração terminar; durante a duração, pode conjurar Comando como Ação Bônus sem gastar espaço, e criaturas Enfeitiçadas por você falham automaticamente a salvaguarda contra esse Comando. Uso gratuito: 1×/Descanso Longo; recuperação alternativa: gastar um espaço de magia de 3º círculo ou superior (nenhuma ação).",
  },
  {
    id: "bardo-glamour-majestade-inquebravel-14",
    name: "Majestade Inquebrável",
    sourceType: "subclass",
    subclassFullName: "Colégio do Glamour",
    level: 14,
    autoGranted: true,
    summary:
      "Ação Bônus: assume uma presença por 1 minuto ou até ficar Incapacitado. Na primeira vez em cada turno que uma criatura acerta você com um ataque, o atacante faz Salv. CAR contra sua CD de magia; falha → o ataque falha. 1×/Descanso Curto ou Longo.",
  },

  // ---------- Patrono Arquifada ----------
  {
    id: "bruxo-arquifada-magias-de-pacto-3",
    name: "Magias de Pacto da Arquifada",
    sourceType: "subclass",
    subclassFullName: "Patrono Arquifada",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal (rules/warlockAutoPreparedSpells.ts — nunca neste campo): nível 3 — Acalmar Emoções, Fogo das Fadas, Força Espectral, Passo Nebuloso, Sono; nível 5 — Crescimento de Plantas, Piscar; nível 7 — Dominar Fera, Invisibilidade Maior; nível 9 — Dominar Pessoa, Similaridade.",
  },
  {
    id: "bruxo-arquifada-passos-feericos-3",
    name: "Passos Feéricos",
    sourceType: "subclass",
    subclassFullName: "Patrono Arquifada",
    level: 3,
    autoGranted: true,
    summary:
      "Usos gratuitos de Passo Nebuloso = modificador de CAR (mínimo 1), recupera todos/Descanso Longo. Ao conjurar, escolha: Passo Provocante (criaturas a até 1,5m do espaço deixado fazem Salv. SAB vs CD de magia; falha → Desv. em Atq contra outros alvos até o início do seu próx. turno) ou Passo Revigorante (após o teleporte, você ou criatura visível a 3m ganha 1d10 PV Temp). A partir do nível 6 (Fuga em Névoa), a MESMA característica ganha mais opções — nunca um bloco separado.",
  },
  {
    id: "bruxo-arquifada-fuga-em-nevoa-6",
    name: "Fuga em Névoa",
    sourceType: "subclass",
    subclassFullName: "Patrono Arquifada",
    level: 6,
    autoGranted: true,
    summary:
      "Passos Feéricos: pode usar Passo Nebuloso como Reação ao sofrer dano. Novas opções: Passo Desvanecedor (fica Invisível até o início do próx. turno, ou até atacar/causar dano/conjurar magia) e Passo Terrível (criaturas a até 1,5m da origem OU do destino fazem Salv. SAB; falha → 2d10 Psíquico). Atualiza o mesmo bloco de Passos Feéricos — nunca '#Fuga em Névoa' separadamente.",
  },
  {
    id: "bruxo-arquifada-defesas-sedutoras-10",
    name: "Defesas Sedutoras",
    sourceType: "subclass",
    subclassFullName: "Patrono Arquifada",
    level: 10,
    autoGranted: true,
    summary:
      "Imunidade a Enfeitiçado. Reação quando uma criatura visível acerta você: reduz o dano à metade; o atacante faz Salv. SAB vs CD de magia; falha → sofre dano Psíquico igual ao dano que você sofreu. 1×/Descanso Longo; recuperação alternativa: gastar 1 espaço de Magia de Pacto.",
  },
  {
    id: "bruxo-arquifada-magia-sedutora-14",
    name: "Magia Sedutora",
    sourceType: "subclass",
    subclassFullName: "Patrono Arquifada",
    level: 14,
    autoGranted: true,
    summary: "Após conjurar uma magia de Encantamento ou Ilusão usando uma ação e um espaço de magia, pode conjurar Passo Nebuloso como parte da mesma ação, sem gastar espaço.",
  },

  // ---------- Patrono Celestial ----------
  {
    id: "bruxo-celestial-magias-de-pacto-3",
    name: "Magias de Pacto do Celestial",
    sourceType: "subclass",
    subclassFullName: "Patrono Celestial",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal: nível 3 — Auxílio, Chama Sagrada, Curar Ferimentos, Luz, Raio Guia, Restauração Menor; nível 5 — Luz do Dia, Revivificar; nível 7 — Defensor da Fé, Muralha de Fogo; nível 9 — Convocar Celestial, Restauração Maior.",
  },
  {
    id: "bruxo-celestial-luz-medicinal-3",
    name: "Luz Medicinal",
    sourceType: "subclass",
    subclassFullName: "Patrono Celestial",
    level: 3,
    autoGranted: true,
    summary:
      "Reserva de 1 + nível de Bruxo dados d6. Ação Bônus: você ou criatura visível a até 18m; gaste até o modificador de CAR (mínimo 1) dados, cure PV = total rolado. Recupera todos/Descanso Longo.",
  },
  {
    id: "bruxo-celestial-alma-radiante-6",
    name: "Alma Radiante",
    sourceType: "subclass",
    subclassFullName: "Patrono Celestial",
    level: 6,
    autoGranted: true,
    summary: "Resistência a dano Radiante. 1×/turno, ao conjurar magia de dano Ígneo ou Radiante: 1 alvo da magia recebe dano adicional igual ao seu modificador de CAR.",
  },
  {
    id: "bruxo-celestial-resiliencia-celestial-10",
    name: "Resiliência Celestial",
    sourceType: "subclass",
    subclassFullName: "Patrono Celestial",
    level: 10,
    autoGranted: true,
    summary:
      "Ao usar Astúcia Mágica, ou completar Descanso Curto ou Longo: você ganha PV Temp = nível de Bruxo + modificador de CAR; até 5 criaturas visíveis escolhidas ganham PV Temp = metade do nível de Bruxo (arredondado para baixo) + modificador de CAR.",
  },
  {
    id: "bruxo-celestial-vinganca-calcinante-14",
    name: "Vingança Calcinante",
    sourceType: "subclass",
    subclassFullName: "Patrono Celestial",
    level: 14,
    autoGranted: true,
    summary:
      "1×/Descanso Longo, quando você ou um aliado a até 18m está prestes a fazer uma Salv. contra a morte: o alvo recupera PV = metade dos PV máximos e pode encerrar a condição Caído. Criaturas escolhidas a até 9m do alvo sofrem 2d8 + modificador de CAR de dano Radiante e ficam Cegas até o fim do turno atual.",
  },

  // ---------- Patrono Grande Antigo ----------
  {
    id: "bruxo-grande-antigo-magias-de-pacto-3",
    name: "Magias de Pacto do Grande Antigo",
    sourceType: "subclass",
    subclassFullName: "Patrono Grande Antigo",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal: nível 3 — Detectar Pensamentos, Força Espectral, Gargalhada Nefasta de Tasha, Sussurros Dissonantes; nível 5 — Clarividência, Fome de Hadar; nível 7 — Confusão, Invocar Aberração; nível 9 — Modificar Memória, Telecinese.",
  },
  {
    id: "bruxo-grande-antigo-magias-psiquicas-3",
    name: "Magias Psíquicas",
    sourceType: "subclass",
    subclassFullName: "Patrono Grande Antigo",
    level: 3,
    autoGranted: true,
    summary:
      "Uma magia de Bruxo que cause dano pode ter o tipo de dano alterado para Psíquico. Magias de Bruxo de Encantamento ou Ilusão podem ser conjuradas sem componentes Verbais nem Somáticos.",
  },
  {
    id: "bruxo-grande-antigo-mente-desperta-3",
    name: "Mente Desperta",
    sourceType: "subclass",
    subclassFullName: "Patrono Grande Antigo",
    level: 3,
    autoGranted: true,
    summary:
      "Ação Bônus: cria um laço telepático com 1 criatura visível a até 9m, exigindo um idioma mental em comum; comunicação telepática a 1,5km × modificador de CAR (mínimo 1,5km), por minutos = seu nível de Bruxo. Um novo laço encerra o anterior.",
  },
  {
    id: "bruxo-grande-antigo-combatente-clarividente-6",
    name: "Combatente Clarividente",
    sourceType: "subclass",
    subclassFullName: "Patrono Grande Antigo",
    level: 6,
    autoGranted: true,
    summary:
      "Ao criar o laço de Mente Desperta, pode exigir Salv. SAB vs CD de magia; falha → o alvo tem Desv. em Atq contra você e você tem Vant. em Atq contra ele, pela duração do laço. 1×/Descanso Curto ou Longo; recuperação alternativa: gastar 1 espaço de Magia de Pacto.",
  },
  {
    id: "bruxo-grande-antigo-danacao-mistica-10",
    name: "Danação Mística",
    sourceType: "subclass",
    subclassFullName: "Patrono Grande Antigo",
    level: 10,
    autoGranted: true,
    summary:
      "Danação fica sempre preparada (rules/warlockAutoPreparedSpells.ts). Modificação: ao escolher o atributo, o alvo também tem Desvantagem nas salvaguardas desse atributo pela duração — anotado diretamente na entrada de Danação na área de Magias, nunca neste campo.",
  },
  {
    id: "bruxo-grande-antigo-escudo-mental-10",
    name: "Escudo Mental",
    sourceType: "subclass",
    subclassFullName: "Patrono Grande Antigo",
    level: 10,
    autoGranted: true,
    summary: "Seus pensamentos não podem ser lidos sem sua permissão. Resistência a dano Psíquico. Quando uma criatura causa dano Psíquico em você, ela sofre a mesma quantidade de dano.",
  },
  {
    id: "bruxo-grande-antigo-criar-servo-14",
    name: "Criar Servo",
    sourceType: "subclass",
    subclassFullName: "Patrono Grande Antigo",
    level: 14,
    autoGranted: true,
    summary:
      "Modifica Invocar Aberração: pode conjurá-la sem Concentração, com duração de 1 minuto; a aberração ganha PV Temp = nível de Bruxo + modificador de CAR. Na primeira vez em cada turno que ela atingir uma criatura sob sua Danação, causa dano Psíquico adicional igual ao dano bônus de Danação. Anotado diretamente na entrada de Invocar Aberração na área de Magias, nunca neste campo.",
  },

  // ---------- Patrono Ínfero ----------
  {
    id: "bruxo-infero-magias-de-pacto-3",
    name: "Magias de Pacto do Ínfero",
    sourceType: "subclass",
    subclassFullName: "Patrono Ínfero",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal: nível 3 — Comando, Mãos Flamejantes, Raio Ardente, Sugestão; nível 5 — Bola de Fogo, Nuvem Fétida; nível 7 — Escudo Ardente, Muralha de Fogo; nível 9 — Missão, Praga de Insetos.",
  },
  {
    id: "bruxo-infero-bencao-do-tenebroso-3",
    name: "Bênção do Tenebroso",
    sourceType: "subclass",
    subclassFullName: "Patrono Ínfero",
    level: 3,
    autoGranted: true,
    summary:
      "Quando você reduz um inimigo a 0 PV, ou outra criatura o faz a até 3m de você: ganha PV Temp = modificador de CAR + nível de Bruxo (mínimo 1).",
  },
  {
    id: "bruxo-infero-sorte-do-proprio-tenebroso-6",
    name: "A Sorte do Próprio Tenebroso",
    sourceType: "subclass",
    subclassFullName: "Patrono Ínfero",
    level: 6,
    autoGranted: true,
    summary:
      "Após fazer um teste de atributo ou uma salvaguarda e ver o resultado, mas antes dos efeitos: pode adicionar +1d10. Usos = modificador de CAR (mínimo 1), recupera todos/Descanso Longo.",
  },
  {
    id: "bruxo-infero-resistencia-infera-10",
    name: "Resistência Ínfera",
    sourceType: "subclass",
    subclassFullName: "Patrono Ínfero",
    level: 10,
    autoGranted: true,
    summary:
      "Após Descanso Curto ou Longo, escolhe 1 tipo de dano (exceto Energético) e recebe Resistência a ele até fazer nova escolha. Escolha alterável durante o jogo — nunca uma decisão permanente do Builder; a ficha pode registrar a escolha atual.",
  },
  {
    id: "bruxo-infero-lancar-no-inferno-14",
    name: "Lançar no Inferno",
    sourceType: "subclass",
    subclassFullName: "Patrono Ínfero",
    level: 14,
    autoGranted: true,
    summary:
      "1×/turno, ao atingir uma criatura com um ataque: ela faz Salv. CAR vs CD de magia; falha → desaparece (se não for Ínfera, sofre 8d10 de dano Psíquico) e fica Incapacitada até o fim do seu próx. turno, depois retorna ao espaço anterior ou ao espaço desocupado mais próximo. 1×/Descanso Longo; recuperação alternativa: gastar 1 espaço de Magia de Pacto.",
  },

  // ============== CLÉRIGO — fonte "INTEGRAÇÃO COMPLETA — CLÉRIGO E SUBCLASSES" ==============
  // Níveis de aquisição de subclasse do Clérigo são 3/6/17 (não 3/6/10/14 — ver
  // data/subclasses.ts#clerigo). "Magias de Domínio" são sempre preparadas e vão
  // para a área de Magias (rules/clericAutoPreparedSpells.ts), nunca para
  // "Características de Classe".

  // ---------- Domínio da Guerra ----------
  {
    id: "clerigo-guerra-magias-de-dominio-3",
    name: "Magias de Domínio da Guerra",
    sourceType: "subclass",
    subclassFullName: "Domínio da Guerra",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal (rules/clericAutoPreparedSpells.ts — nunca neste campo): nível 3 — Arma Espiritual, Arma Mágica, Escudo da Fé, Raio Guia; nível 5 — Guardiões Espirituais, Manto do Cruzado; nível 7 — Escudo Ardente, Movimentação Livre; nível 9 — Golpe de Arço, Paralisar Monstro.",
  },
  {
    id: "clerigo-guerra-ataque-direcionado-3",
    name: "Ataque Direcionado",
    sourceType: "subclass",
    subclassFullName: "Domínio da Guerra",
    level: 3,
    autoGranted: true,
    summary:
      "Opção de Canalizar Divindade — nunca um conjunto de usos próprio, consome o mesmo recurso de Canalizar Divindade. Quando você ou uma criatura visível a 9m erra um ataque, gaste 1 uso de Canalizar Divindade: +10 ao resultado da rolagem (pode transformar o erro em acerto). Se o ataque for de outra criatura, use sua Reação.",
  },
  {
    id: "clerigo-guerra-sacerdote-da-guerra-3",
    name: "Sacerdote da Guerra",
    sourceType: "subclass",
    subclassFullName: "Domínio da Guerra",
    level: 3,
    autoGranted: true,
    summary:
      "Usos próprios (não é Canalizar Divindade) = modificador de Sabedoria, mínimo 1; recupera todos após Descanso Curto ou Longo. Ação Bônus: 1 ataque com arma ou 1 ataque desarmado.",
  },
  {
    id: "clerigo-guerra-bencao-do-deus-da-guerra-6",
    name: "Bênção do Deus da Guerra",
    sourceType: "subclass",
    subclassFullName: "Domínio da Guerra",
    level: 6,
    autoGranted: true,
    summary:
      "Opção de Canalizar Divindade — nunca um conjunto de usos próprio. Gaste 1 uso de Canalizar Divindade: conjure Arma Espiritual ou Escudo da Fé sem gastar espaço de magia e sem Concentração; duração 1 minuto; termina antes se conjurar de novo, ficar Incapacitado, ou morrer.",
  },
  {
    id: "clerigo-guerra-avatar-da-guerra-17",
    name: "Avatar da Guerra",
    sourceType: "subclass",
    subclassFullName: "Domínio da Guerra",
    level: 17,
    autoGranted: true,
    summary: "Resistência a dano Contundente, Cortante e Perfurante.",
  },

  // ---------- Domínio da Luz ----------
  {
    id: "clerigo-luz-magias-de-dominio-3",
    name: "Magias de Domínio da Luz",
    sourceType: "subclass",
    subclassFullName: "Domínio da Luz",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal (rules/clericAutoPreparedSpells.ts — nunca neste campo): nível 3 — Fogo das Fadas, Mãos Ardentes, Raio Ardente, Ver o Invisível; nível 5 — Bola de Fogo, Luz do Dia; nível 7 — Muralha de Fogo, Olho Arcano; nível 9 — Coluna de Chamas, Vidência.",
  },
  {
    id: "clerigo-luz-brilho-do-amanhecer-3",
    name: "Brilho do Amanhecer",
    sourceType: "subclass",
    subclassFullName: "Domínio da Luz",
    level: 3,
    autoGranted: true,
    summary:
      "Opção de Canalizar Divindade — nunca um conjunto de usos próprio. Ação: Usar Magia; Emanação de 9m que primeiro dissipa Escuridão mágica na área; criaturas escolhidas na área fazem Salvaguarda de Constituição contra dano Radiante igual a 2d10 + seu nível de Clérigo; falha: dano completo, sucesso: metade.",
  },
  {
    id: "clerigo-luz-labareda-protetora-3",
    name: "Labareda Protetora",
    sourceType: "subclass",
    subclassFullName: "Domínio da Luz",
    level: 3,
    autoGranted: true,
    summary:
      "Usos próprios (não é Canalizar Divindade) = modificador de Sabedoria, mínimo 1; recupera todos após Descanso Longo. Reação: quando uma criatura visível a 9m faz um ataque (antes de saber se acerta ou erra), impõe Desvantagem nesse ataque. A partir do nível 6 (Labareda Protetora Aprimorada — mesma característica, nunca um bloco separado): recupera todos após Descanso Curto OU Longo, e o alvo do ataque ganha PV Temporários = 2d6 + modificador de Sabedoria.",
  },
  {
    id: "clerigo-luz-labareda-protetora-aprimorada-6",
    name: "Labareda Protetora Aprimorada",
    sourceType: "subclass",
    subclassFullName: "Domínio da Luz",
    level: 6,
    autoGranted: true,
    summary:
      "Atualiza Labareda Protetora — nunca um bloco separado. Passa a recuperar todos os usos após Descanso Curto OU Longo (antes só Longo); além disso, o alvo do ataque sofrido ganha PV Temporários = 2d6 + modificador de Sabedoria.",
  },
  {
    id: "clerigo-luz-coroa-de-luz-17",
    name: "Coroa de Luz",
    sourceType: "subclass",
    subclassFullName: "Domínio da Luz",
    level: 17,
    autoGranted: true,
    summary:
      "Usos próprios (não é Canalizar Divindade) = modificador de Sabedoria, mínimo 1; recupera todos após Descanso Longo. Ação: cria uma aura por 1 minuto (ou até você encerrar sem gastar ação) de Luz Plena em 18m + Penumbra em mais 9m; inimigos na Luz Plena têm Desvantagem em salvaguardas contra Brilho do Amanhecer e contra magias que causem dano de Fogo ou Radiante.",
  },

  // ---------- Domínio da Trapaça ----------
  {
    id: "clerigo-trapaca-magias-de-dominio-3",
    name: "Magias de Domínio da Trapaça",
    sourceType: "subclass",
    subclassFullName: "Domínio da Trapaça",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal (rules/clericAutoPreparedSpells.ts — nunca neste campo): nível 3 — Disfarçar-se, Enfeitiçar Pessoa, Invisibilidade, Passo Sem Rastro; nível 5 — Indetectável, Padrão Hipnótico; nível 7 — Confusão, Porta Dimensional; nível 9 — Dominar Pessoa, Modificar Memória.",
  },
  {
    id: "clerigo-trapaca-bencao-do-trapaceiro-3",
    name: "Bênção do Trapaceiro",
    sourceType: "subclass",
    subclassFullName: "Domínio da Trapaça",
    level: 3,
    autoGranted: true,
    summary:
      "NÃO é opção de Canalizar Divindade. Ação: Usar Magia; alvo você mesmo ou uma criatura disposta a até 9m — ganha Vantagem em testes de Destreza (Furtividade); dura até o próximo Descanso Longo ou até você usar de novo.",
  },
  {
    id: "clerigo-trapaca-invocar-duplicidade-3",
    name: "Invocar Duplicidade",
    sourceType: "subclass",
    subclassFullName: "Domínio da Trapaça",
    level: 3,
    autoGranted: true,
    summary:
      "Opção de Canalizar Divindade — nunca um conjunto de usos próprio. Gaste 1 uso, Ação Bônus: cria uma duplicata ilusória de si mesmo num espaço desocupado e visível a até 9m; a ilusão é intangível, não ocupa espaço, dura 1 minuto, e termina se você ficar Incapacitado ou encerrar sem gastar ação. Pode conjurar magias como se estivesse no espaço da ilusão, usando seus próprios sentidos; se você e a ilusão estiverem a até 1,5m do mesmo alvo, você tem Vantagem em ataques contra ele. Ação Bônus: move a ilusão até 9m, desde que o destino esteja a até 36m de você. A partir do nível 6 (Transposição do Trapaceiro): ao usar essa Ação Bônus para criar ou mover a ilusão, pode trocar de lugar com ela. A partir do nível 17 (Duplicidade Aprimorada): Distração Compartilhada — quando uma criatura está a até 1,5m da ilusão, você E seus aliados têm Vantagem em ataques contra ela; Ilusão de Cura — quando a ilusão termina, você ou uma criatura escolhida a até 1,5m recupera PV iguais ao seu nível de Clérigo. Mesma característica em todos os níveis, nunca um bloco separado.",
  },
  {
    id: "clerigo-trapaca-transposicao-do-trapaceiro-6",
    name: "Transposição do Trapaceiro",
    sourceType: "subclass",
    subclassFullName: "Domínio da Trapaça",
    level: 6,
    autoGranted: true,
    summary:
      "Atualiza Invocar Duplicidade — nunca um bloco separado. Ao usar a Ação Bônus de Invocar Duplicidade para criar ou mover a ilusão, pode trocar de lugar com ela.",
  },
  {
    id: "clerigo-trapaca-duplicidade-aprimorada-17",
    name: "Duplicidade Aprimorada",
    sourceType: "subclass",
    subclassFullName: "Domínio da Trapaça",
    level: 17,
    autoGranted: true,
    summary:
      "Atualiza Invocar Duplicidade — nunca um bloco separado. Distração Compartilhada: quando uma criatura está a até 1,5m da ilusão, você E seus aliados têm Vantagem em ataques contra ela (antes, só você). Ilusão de Cura: quando a ilusão termina, você ou uma criatura escolhida a até 1,5m recupera PV iguais ao seu nível de Clérigo.",
  },

  // ---------- Domínio da Vida ----------
  {
    id: "clerigo-vida-magias-de-dominio-3",
    name: "Magias de Domínio da Vida",
    sourceType: "subclass",
    subclassFullName: "Domínio da Vida",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal (rules/clericAutoPreparedSpells.ts — nunca neste campo): nível 3 — Auxílio, Bênção, Curar Ferimentos, Restauração Menor; nível 5 — Palavra Curativa em Massa, Revivificar; nível 7 — Aura de Vida, Proteção Contra a Morte; nível 9 — Curar Ferimentos em Massa, Restauração Maior.",
  },
  {
    id: "clerigo-vida-discipulo-da-vida-3",
    name: "Discípulo da Vida",
    sourceType: "subclass",
    subclassFullName: "Domínio da Vida",
    level: 3,
    autoGranted: true,
    summary:
      "NÃO é opção de Canalizar Divindade. Quando conjura, com um espaço de magia, uma magia que restaura PV, o alvo recupera PV adicionais iguais a 2 + o círculo do espaço usado, no mesmo turno. A partir do nível 6 (Curandeiro Abençoado — mesma característica, nunca um bloco separado): quando essa magia de cura com espaço tem como alvo outra criatura que não você, você também recupera PV iguais a 2 + o círculo do espaço, imediatamente depois.",
  },
  {
    id: "clerigo-vida-curandeiro-abencoado-6",
    name: "Curandeiro Abençoado",
    sourceType: "subclass",
    subclassFullName: "Domínio da Vida",
    level: 6,
    autoGranted: true,
    summary:
      "Atualiza Discípulo da Vida — nunca um bloco separado. Quando você conjura, com um espaço de magia, uma magia de cura que tem como alvo outra criatura, você também recupera PV iguais a 2 + o círculo do espaço, imediatamente depois.",
  },
  {
    id: "clerigo-vida-preservar-a-vida-3",
    name: "Preservar a Vida",
    sourceType: "subclass",
    subclassFullName: "Domínio da Vida",
    level: 3,
    autoGranted: true,
    summary:
      "Opção de Canalizar Divindade — nunca um conjunto de usos próprio. Ação: Usar Magia; reserva total = 5x seu nível de Clérigo; distribua PV dessa reserva entre criaturas Sangrando ou morrendo a até 9m (pode incluir você mesmo); nenhuma criatura recupera PV além de metade do seu máximo.",
  },
  {
    id: "clerigo-vida-cura-suprema-17",
    name: "Cura Suprema",
    sourceType: "subclass",
    subclassFullName: "Domínio da Vida",
    level: 17,
    autoGranted: true,
    summary:
      "Ao usar uma magia ou Canalizar Divindade para restaurar PV, não role os dados de cura — use o resultado máximo possível de cada dado (ex.: 2d6 vira 12).",
  },

  // ============== DRUIDA — fonte "INTEGRAÇÃO COMPLETA — DRUIDA E SUBCLASSES" ==============
  // Níveis de aquisição de subclasse do Druida são 3/6/10/14 (ver
  // data/subclasses.ts#druida). "Magias de Círculo" são sempre
  // preparadas e vão para a área de Magias
  // (rules/druidAutoPreparedSpells.ts), nunca para "Características de
  // Classe".

  // ---------- Círculo da Lua ----------
  {
    id: "druida-lua-formas-animais-dos-circulos-druidicos-3",
    name: "Formas Animais dos Círculos Druídicos",
    sourceType: "subclass",
    subclassFullName: "Círculo da Lua",
    level: 3,
    autoGranted: true,
    summary:
      "Modifica Forma Selvagem — nunca um bloco impresso separado (rules/druidPrintedFeatures.ts). ND máximo = nível de Druida / 3, arredondado para baixo (substitui o limite normal da Forma Selvagem quando for maior). Enquanto em Forma Selvagem: CA = 13 + modificador de Sabedoria, só se esse valor for maior que a CA da Fera. Ao entrar em Forma Selvagem: PV Temp = 3x o nível de Druida (substitui o valor normal, que é igual ao nível).",
  },
  {
    id: "druida-lua-magias-do-circulo-da-lua-3",
    name: "Magias do Círculo da Lua",
    sourceType: "subclass",
    subclassFullName: "Círculo da Lua",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal, e podem ser conjuradas mesmo em Forma Selvagem (rules/druidAutoPreparedSpells.ts — nunca neste campo): nível 3 — Curar Ferimentos, Fagulha Estelar, Raio Lunar; nível 5 — Invocar Animais; nível 7 — Fonte do Luar; nível 9 — Curar Ferimentos em Massa.",
  },
  {
    id: "druida-lua-formas-animais-aprimorada-6",
    name: "Formas Animais Aprimorada",
    sourceType: "subclass",
    subclassFullName: "Círculo da Lua",
    level: 6,
    autoGranted: true,
    summary:
      "Modifica Forma Selvagem — nunca impressa com este título. Enquanto em Forma Selvagem, o ataque da Fera pode causar dano normal OU Radiante (escolha a cada acerto); além disso, soma o modificador de Sabedoria em Salvaguardas de Constituição.",
  },
  {
    id: "druida-lua-passo-lunar-10",
    name: "Passo Lunar",
    sourceType: "subclass",
    subclassFullName: "Círculo da Lua",
    level: 10,
    autoGranted: true,
    summary:
      "Ação Bônus: teleporte até 9m para um espaço livre visível; Vantagem no próximo ataque antes do fim do turno. Usos = modificador de Sabedoria, mínimo 1; recupera todos após Descanso Longo; recuperação alternativa (sem ação): gastar 1 espaço de 2º círculo ou superior para recuperar 1 uso.",
  },
  {
    id: "druida-lua-forma-lunar-14",
    name: "Forma Lunar",
    sourceType: "subclass",
    subclassFullName: "Círculo da Lua",
    level: 14,
    autoGranted: true,
    summary:
      "NÃO cria '#Forma Lunar' — atualiza outras duas características. Radiância Lunar Aprimorada (modifica Forma Selvagem): 1x por turno, ao acertar com o ataque da Fera em Forma Selvagem, +2d10 de dano Radiante. Luar Compartilhado (modifica Passo Lunar): ao usar Passo Lunar, pode levar 1 criatura voluntária a até 3m consigo; ela aparece em um espaço livre a até 3m do seu destino.",
  },

  // ---------- Círculo da Terra ----------
  {
    id: "druida-terra-terreno-escolha",
    name: "Terreno do Círculo da Terra",
    sourceType: "subclass",
    subclassFullName: "Círculo da Terra",
    level: 3,
    autoGranted: false,
    summary:
      "Escolha obrigatória e duradoura entre Árido, Polar, Temperado e Tropical — resolvida numa etapa PRÓPRIA do Builder (não na etapa genérica de Características), porque altera automaticamente Magias do Círculo da Terra, a Resistência de Proteção Natural (nível 10+) e Santuário Natural (nível 14+). Pode ser trocada depois de um Descanso Longo; ao trocar, os benefícios do terreno anterior saem e os do novo terreno entram, sem remover uma mesma magia caso o personagem também a possua por outra fonte.",
  },
  {
    id: "druida-terra-magias-do-circulo-da-terra-3",
    name: "Magias do Círculo da Terra",
    sourceType: "subclass",
    subclassFullName: "Círculo da Terra",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas enquanto o terreno escolhido permanecer selecionado (rules/druidAutoPreparedSpells.ts — nunca neste campo), não contam contra o limite normal. Árido: nível 3 — Mãos Flamejantes, Raio de Fogo, Turvar; nível 5 — Bola de Fogo; nível 7 — Malogro; nível 9 — Muralha de Pedra. Polar: nível 3 — Névoa Obscurecente, Paralisar Pessoa, Raio de Gelo; nível 5 — Nevasca; nível 7 — Tempestade Glacial; nível 9 — Cone de Frio. Temperado: nível 3 — Passo Nebuloso, Sono, Toque Chocante; nível 5 — Relâmpago; nível 7 — Movimentação Livre; nível 9 — Passo Arbóreo. Tropical: nível 3 — Bolha Ácida, Raio Nauseante, Teia; nível 5 — Nuvem Fétida; nível 7 — Polimorfia; nível 9 — Praga de Insetos.",
  },
  {
    id: "druida-terra-auxilio-da-terra-3",
    name: "Auxílio da Terra",
    sourceType: "subclass",
    subclassFullName: "Círculo da Terra",
    level: 3,
    autoGranted: true,
    summary:
      "Custo: 1 uso de Forma Selvagem. Ação: Usar Magia; ponto a até 18m, área Esfera de 3m de raio; criaturas escolhidas fazem Salvaguarda de Constituição contra a CD de magia — falha: dano Necrótico (2d6 nos níveis 3-9, 3d6 nos níveis 10-13, 4d6 no nível 14+), sucesso: metade. Além disso, 1 criatura escolhida na área cura PV iguais ao mesmo total de dados.",
  },
  {
    id: "druida-terra-recuperacao-natural-6",
    name: "Recuperação Natural",
    sourceType: "subclass",
    subclassFullName: "Círculo da Terra",
    level: 6,
    autoGranted: true,
    summary:
      "Dois benefícios independentes, cada um 1x/Descanso Longo, com caixa própria. Magia gratuita: pode conjurar 1 magia de 1º círculo ou superior preparada por Magias do Círculo da Terra sem gastar espaço. Recuperação de espaços: ao completar um Descanso Curto, recupera espaços de magia gastos cuja soma de círculos seja no máximo metade do nível de Druida (arredondado para cima); nenhum espaço recuperado pode ser de 6º círculo ou superior.",
  },
  {
    id: "druida-terra-protecao-natural-10",
    name: "Proteção Natural",
    sourceType: "subclass",
    subclassFullName: "Círculo da Terra",
    level: 10,
    autoGranted: true,
    summary:
      "Concede Imunidade a Envenenado, e Resistência conforme o terreno atual (recalculada automaticamente ao trocar de terreno): Árido -> Ígneo; Polar -> Gélido; Temperado -> Elétrico; Tropical -> Venenoso.",
  },
  {
    id: "druida-terra-santuario-natural-14",
    name: "Santuário Natural",
    sourceType: "subclass",
    subclassFullName: "Círculo da Terra",
    level: 14,
    autoGranted: true,
    summary:
      "Custo: 1 uso de Forma Selvagem. Ação: cria um Cubo de 4,5m no chão, a até 36m, por 1 minuto (termina antes se morrer ou ficar Incapacitado). Dentro da área, você e aliados têm Cobertura Parcial; aliados também recebem a Resistência atual de Proteção Natural. Ação Bônus: move o Cubo até 18m para um novo local no chão, a até 36m de você.",
  },

  // ---------- Círculo das Estrelas ----------
  {
    id: "druida-estrelas-forma-estrelada-3",
    name: "Forma Estrelada",
    sourceType: "subclass",
    subclassFullName: "Círculo das Estrelas",
    level: 3,
    autoGranted: true,
    summary:
      "Custo: 1 uso de Forma Selvagem. Ação Bônus: em vez de multimorfar, assume a Forma Estrelada (mantém suas estatísticas normais) por 10 min, encerrando antes se dispensar, ficar Incapacitado, ou usar de novo; emite Luz Plena em 3m + Meia-luz em mais 3m. Ao ativar, escolhe 1 constelação (escolha feita a cada ativação, NUNCA uma decisão permanente do Builder): Arqueiro (ao ativar e depois em turnos seguintes como Ação Bônus: ataque mágico à distância, alcance 18m, dano 1d8+Sabedoria Radiante), Dragão (testes de INT/SAB e Salvaguardas de CON para manter Concentração: resultado de d20 igual a 9 ou menos é tratado como 10), ou Taça (ao conjurar magia com espaço que restaure PV: você ou outra criatura a até 9m cura 1d8+Sabedoria adicional).",
  },
  {
    id: "druida-estrelas-mapa-estelar-3",
    name: "Mapa Estelar",
    sourceType: "subclass",
    subclassFullName: "Círculo das Estrelas",
    level: 3,
    autoGranted: true,
    summary:
      "O Mapa Estelar pode servir como Foco Druídico. Enquanto o possuir, Orientação e Raio Guia ficam sempre preparadas (origem: Mapa Estelar — rules/druidAutoPreparedSpells.ts), sem contar contra o limite normal. Raio Guia pode ser conjurado sem gastar espaço: usos = modificador de Sabedoria, mínimo 1, recupera todos após Descanso Longo (rastreado junto à magia na área de Magias). A cerimônia de substituição do mapa leva 1 hora, pode ocorrer em Descanso Curto ou Longo, e destrói o mapa anterior — mantida no domínio/Ficha Web.",
  },
  {
    id: "druida-estrelas-pressagio-cosmico-6",
    name: "Presságio Cósmico",
    sourceType: "subclass",
    subclassFullName: "Círculo das Estrelas",
    level: 6,
    autoGranted: true,
    summary:
      "Após um Descanso Longo, joga um dado: par = Prosperidade, ímpar = Infortúnio (estado de jogo do dia atual, não escolha permanente do Builder), vigente até o próximo Descanso Longo. Reação quando uma criatura visível a até 9m faz um teste de d20: soma +1d6 (Prosperidade) ou -1d6 (Infortúnio) ao total. Usos = modificador de Sabedoria, mínimo 1; recupera todos após Descanso Longo.",
  },
  {
    id: "druida-estrelas-constelacoes-cintilantes-10",
    name: "Constelações Cintilantes",
    sourceType: "subclass",
    subclassFullName: "Círculo das Estrelas",
    level: 10,
    autoGranted: true,
    summary:
      "Não impressa com este título — atualiza Forma Estrelada. Arqueiro e Taça: o dado passa de 1d8 para 2d8. Dragão: ganha Deslocamento de Voo igual ao Deslocamento, podendo pairar. Além disso, no início de cada turno em Forma Estrelada, pode trocar a constelação ativa.",
  },
  {
    id: "druida-estrelas-repleto-de-estrelas-14",
    name: "Repleto de Estrelas",
    sourceType: "subclass",
    subclassFullName: "Círculo das Estrelas",
    level: 14,
    autoGranted: true,
    summary: "Não cria bloco separado — atualiza Forma Estrelada. Enquanto em Forma Estrelada, ganha Resistência a dano Contundente, Cortante e Perfurante.",
  },

  // ---------- Círculo do Mar ----------
  {
    id: "druida-mar-ira-do-mar-3",
    name: "Ira do Mar",
    sourceType: "subclass",
    subclassFullName: "Círculo do Mar",
    level: 3,
    autoGranted: true,
    summary:
      "Custo: 1 uso de Forma Selvagem. Ação Bônus: cria uma Emanação de 1,5m ao seu redor por 10 min, encerrando antes se dispensar, manifestar de novo, ou ficar Incapacitado. Ao manifestar e depois como Ação Bônus: escolhe 1 outra criatura visível na Emanação, que faz Salvaguarda de Constituição contra a CD de magia — falha: dano Gélido igual a uma quantidade de d6 igual ao modificador de Sabedoria (mínimo 1d6); se o alvo for Grande ou menor, também é empurrado até 4,5m.",
  },
  {
    id: "druida-mar-magias-do-circulo-do-mar-3",
    name: "Magias do Círculo do Mar",
    sourceType: "subclass",
    subclassFullName: "Círculo do Mar",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal (rules/druidAutoPreparedSpells.ts — nunca neste campo): nível 3 — Despedaçar, Lufada de Vento, Névoa Obscurecente, Onda Trovejante, Raio de Gelo; nível 5 — Relâmpago, Respirar na Água; nível 7 — Controlar Água, Tempestade Glacial; nível 9 — Invocar Elemental, Paralisar Monstro.",
  },
  {
    id: "druida-mar-afinidade-aquatica-6",
    name: "Afinidade Aquática",
    sourceType: "subclass",
    subclassFullName: "Círculo do Mar",
    level: 6,
    autoGranted: true,
    summary:
      "Modifica Ira do Mar — nunca bloco separado: a Emanação cresce de 1,5m para 3m. Além disso, concede Deslocamento de Natação igual ao Deslocamento normal — PERMANENTE (não depende de Ira do Mar estar ativa), aplicado diretamente ao cálculo de deslocamento (rules/speed.ts#getSwimSpeed); não repetido neste campo quando representado adequadamente no deslocamento.",
  },
  {
    id: "druida-mar-filho-da-tempestade-10",
    name: "Filho da Tempestade",
    sourceType: "subclass",
    subclassFullName: "Círculo do Mar",
    level: 10,
    autoGranted: true,
    summary:
      "Modifica Ira do Mar — nunca bloco separado. Enquanto Ira do Mar estiver ativa: Deslocamento de Voo igual ao Deslocamento, e Resistência a dano Elétrico/Gélido/Trovejante. Como só existe enquanto a Emanação está ativa, NUNCA aplicado como valor permanente da ficha.",
  },
  {
    id: "druida-mar-manifestacao-oceanica-14",
    name: "Manifestação Oceânica",
    sourceType: "subclass",
    subclassFullName: "Círculo do Mar",
    level: 14,
    autoGranted: true,
    summary:
      "Modifica Ira do Mar — nunca bloco separado. Agora pode manifestar a Emanação ao redor de uma criatura voluntária a até 18m (usando a CD de magia e o modificador de Sabedoria do Druida), ou simultaneamente ao redor de você E dessa criatura, gastando 2 usos de Forma Selvagem nesse caso.",
  },
];
