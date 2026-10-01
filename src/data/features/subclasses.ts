import type { FeatureDefinition } from "../../domain/features.js";
import { CONHECIMENTO_PROFICIENCIAS_BONUS_CHOICE_ID } from "./bard.js";

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
];
