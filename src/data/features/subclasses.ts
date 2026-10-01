import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Features de SUBCLASSE confirmadas com fonte fornecida — por ora só
 * as 4 subclasses do Bárbaro ("INTEGRAÇÃO COMPLETA — BÁRBARO E
 * SUBCLASSES"). As demais ~30 subclasses do projeto continuam sem
 * conteúdo (ver `getSubclassFeatures`, que já filtra por
 * `subclassFullName` + nível e não precisa mudar quando chegarem).
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
];
