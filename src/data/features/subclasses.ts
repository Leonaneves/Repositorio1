import type { FeatureDefinition } from "../../domain/features.js";
import { classes } from "../classes.js";
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
 * Afinidade Elemental (Feitiçaria Dracônica, nível 6+) — mesma
 * arquitetura de Terreno do Círculo da Terra acima: escolha duradoura
 * armazenada em `featureChoiceSelections`, resolvida por etapa PRÓPRIA
 * do Builder (`ui/builder/steps/StepElementalAffinity.tsx`). A fonte
 * "INTEGRAÇÃO COMPLETA — FEITICEIRO, METAMAGIA E SUBCLASSES" §36 não
 * informa troca posterior — tratada como escolha duradoura fixa (nunca
 * recalculada ao "trocar", só preenchida uma vez).
 */
export const ELEMENTAL_AFFINITY_CHOICE_ID = "feiticeiro-draconica-afinidade-elemental-escolha";
export const ELEMENTAL_AFFINITY_OPTIONS = ["Ácido", "Elétrico", "Fogo", "Gelo", "Venenoso"] as const;
export type ElementalAffinity = (typeof ELEMENTAL_AFFINITY_OPTIONS)[number];

/**
 * Perícia escolhida em "Glamour Transcendental" (Andarilho Feérico,
 * nível 3) — primeira e única fonte de proficiência de perícia ligada
 * à SUBCLASSE no projeto hoje (mesmo papel de
 * `ELFO_SENTIDOS_AGUCADOS_CHOICE_ID` para Espécie — ver
 * `rules/skills.ts#isSkillGrantedBySubclassChoice`). Resolvida pela
 * `FeatureChoiceControl` genérica dentro da seção de Subclasse,
 * integrando a mesma validação de conflitos de
 * `rules/skillChoiceConflicts.ts` (via `excludeAlreadyProficient`).
 */
export const RANGER_GLAMOUR_SKILL_CHOICE_ID = "patrulheiro-feerico-glamour-pericia-escolha";

/**
 * "Mente de Ferro" (Vigilante das Sombras, nível 7, fonte "IMPLEMENTAR
 * SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF" §5): concede
 * proficiência em Salvaguarda de Sabedoria automaticamente; se SAB já
 * for proficiente por OUTRA origem (checada ANTES desta própria
 * característica — ela nunca escreve em `character.savingThrows`, só
 * deriva, ver `rules/savingThrows.ts#getMenteDeFerroGrantedAbility`), o
 * jogador escolhe Carisma ou Inteligência no lugar. A `FeatureChoice`
 * só é anexada à `FeatureDefinition` de id `RANGER_MENTE_DE_FERRO_FEATURE_ID`
 * quando essa condição se aplica (`rules/features.ts#getSubclassFeatures`)
 * — nunca exigida fora disso, e a proficiência final nunca é impressa em
 * Características de Classe (aparece direto nas Salvaguardas).
 */
export const RANGER_MENTE_DE_FERRO_FEATURE_ID = "patrulheiro-sombras-mente-de-ferro-7";
export const RANGER_MENTE_DE_FERRO_CHOICE_ID = "patrulheiro-sombras-mente-de-ferro-escolha";

/**
 * ID histórico da escolha "CD de Manobras" (Força ou Destreza) do
 * Mestre de Batalha — REMOVIDA (fonte "AUTOMATIZAR A CD DAS MANOBRAS
 * DO MESTRE DE BATALHA": a decisão nunca deve ser apresentada ao
 * jogador; `rules/maneuvers.ts#getManeuversCd` agora calcula
 * `8 + BP + maior(mod FOR, mod DEX)` automaticamente). Não é mais
 * referenciada por nenhuma `FeatureChoice` — mantida só para que uma
 * seleção antiga eventualmente salva sob este id em personagens
 * existentes fique inerte (nunca lida, nunca usada), sem precisar de
 * migração. Independente da escolha de Força ou Destreza feita a cada
 * uso de Aparar, que continua existindo normalmente.
 */
export const BATTLE_MASTER_CD_ABILITY_CHOICE_ID = "guerreiro-mestre-de-batalha-cd-manobras-atributo-escolha";

/**
 * Perícia escolhida em "Estudioso da Guerra" (Mestre de Batalha, nível
 * 3) — origem "subclass" (ver `rules/skills.ts#isSkillGrantedBySubclassChoice`),
 * independente da escolha de Perícias de Classe do Guerreiro nível 1
 * (`getClassSkillChoiceId`), mesmo papel de `RANGER_GLAMOUR_SKILL_CHOICE_ID`
 * acima para o Andarilho Feérico.
 */
export const FIGHTER_BATTLE_MASTER_ESTUDIOSO_SKILL_CHOICE_ID = "guerreiro-mestre-de-batalha-estudioso-da-guerra-pericia-escolha";

/**
 * "Estilo de Luta Adicional" (Campeão, nível 7) — id usado por
 * `rules/fighterTalentEntries.ts#getFighterFightingStyleTalentEntries`
 * para imprimir o nome digitado (quando preenchido) na caixa de
 * TALENTOS do PDF, nunca em "Características de Classe" (fonte
 * "COMPLETAR A CLASSE PATRULHEIRO NO BUILDER E NO PDF" §8 — mesmo
 * tratamento já dado a "Lições dos Grandes Antigos" do Bruxo).
 */
export const FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID = "guerreiro-campeao-estilo-de-luta-adicional-escolha";

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

  // ============== FEITICEIRO — fonte "INTEGRAÇÃO COMPLETA — FEITICEIRO, METAMAGIA E SUBCLASSES" ==============
  // Níveis de aquisição de subclasse do Feiticeiro são 3/6/14/18 (ver
  // data/subclasses.ts#feiticeiro). "Magias" de cada subclasse são
  // sempre preparadas e vão para a área de Magias
  // (rules/sorcererAutoPreparedSpells.ts), nunca para "Características
  // de Classe". Nomenclatura de tipos de dano desta fonte: só
  // Contundente/Cortante/Perfurante são abreviados (Conc/Cort/Perf);
  // todos os demais tipos (Ácido, Elétrico, Fogo, Gelo, Trovejante,
  // Venenoso, Necrótico, Radiante, Psíquico, Energético) são escritos
  // por extenso — nunca "Ígneo"/"Gélido"/"Ig"/"Gel"/"Elet"/etc.

  // ---------- Feitiçaria Aberrante ----------
  {
    id: "feiticeiro-aberrante-fala-telepatica-3",
    name: "Fala Telepática",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Aberrante",
    level: 3,
    autoGranted: true,
    summary:
      "Ação Bônus: estabelece conexão telepática com 1 criatura visível a até 9m, a uma distância de 1,5km x modificador de Carisma (mínimo 1,5km), por uma duração em minutos igual ao seu nível de Feiticeiro. Para se entenderem, cada criatura usa mentalmente um idioma que conhece e que a outra também entende. Estabelecer uma nova conexão encerra a anterior.",
  },
  {
    id: "feiticeiro-aberrante-magias-psionicas-3",
    name: "Magias Psiônicas",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Aberrante",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal (rules/sorcererAutoPreparedSpells.ts — nunca neste campo): nível 3 — Acalmar Emoções, Braços de Hadar, Detectar Pensamentos, Sussurros Dissonantes, Talho Mental; nível 5 — Fome de Hadar, Remeter; nível 7 — Invocar Aberração, Tentáculos Negros de Evard; nível 9 — Ligação Telepática de Rary, Telecinese.",
  },
  {
    id: "feiticeiro-aberrante-defesas-psiquicas-6",
    name: "Defesas Psíquicas",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Aberrante",
    level: 6,
    autoGranted: true,
    summary: "Concede Resistência a dano Psíquico, e Vantagem em salvaguardas para evitar ou encerrar os efeitos Amedrontado e Enfeitiçado.",
  },
  {
    id: "feiticeiro-aberrante-feiticaria-psionica-6",
    name: "Feitiçaria Psiônica",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Aberrante",
    level: 6,
    autoGranted: true,
    summary:
      "Aplica-se às Magias Psiônicas de 1º círculo ou superior: pode conjurá-las usando um espaço de magia normal OU gastando Pontos de Feitiçaria iguais ao círculo da magia. Se usar Pontos de Feitiçaria: conjura sem componentes Verbais nem Somáticos, e sem Materiais, exceto Material consumido ou com custo especificado. Registrado como nota nas próprias Magias Psiônicas na área de Magias (rules/sorcererAutoPreparedSpells.ts) — nunca um bloco impresso separado.",
  },
  {
    id: "feiticeiro-aberrante-revelacao-em-carne-14",
    name: "Revelação em Carne",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Aberrante",
    level: 14,
    autoGranted: true,
    summary:
      "Ação Bônus, custo de 1 ou mais Pontos de Feitiçaria, duração 10 minutos; para cada Ponto de Feitiçaria gasto, escolhe 1 benefício (sem limite declarado de repetição por benefício): Adaptação Aquática (Deslocamento de Natação = 2x Deslocamento; respira água); Movimento Vermiforme (passa por espaços de até 2,5cm; gastar 1,5m de movimento permite escapar de uma restrição não mágica ou do efeito Imobilizado); Ver o Invisível (vê criaturas Invisíveis a até 18m, exceto atrás de Cobertura Total); Voo Reluzente (Deslocamento de Voo = Deslocamento; pode pairar).",
  },
  {
    id: "feiticeiro-aberrante-implosao-de-distorcao-18",
    name: "Implosão de Distorção",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Aberrante",
    level: 18,
    autoGranted: true,
    summary:
      "Ação (Usar Magia): teleporta-se até 36m. Criaturas a até 9m do espaço de origem fazem uma Salvaguarda de Força — falha: sofrem 3d10 de dano Energético e são puxadas para o espaço deixado; sucesso: metade do dano. Uso: 1x/Descanso Longo; recuperação alternativa: gastar 5 Pontos de Feitiçaria.",
  },

  // ---------- Feitiçaria Dracônica ----------
  {
    id: "feiticeiro-draconica-magias-draconicas-3",
    name: "Magias Dracônicas",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Dracônica",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal (rules/sorcererAutoPreparedSpells.ts — nunca neste campo): nível 3 — Alterar-se, Comando, Orbe Cromático, Sopro de Dragão; nível 5 — Medo, Voo; nível 7 — Enfeitiçar Monstro, Olho Arcano; nível 9 — Invocar Dragão, Lendas e Histórias.",
  },
  {
    id: "feiticeiro-draconica-resiliencia-draconica-3",
    name: "Resiliência Dracônica",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Dracônica",
    level: 3,
    autoGranted: true,
    summary:
      "Aplicado diretamente ao cálculo de PV e CA (rules/hp.ts#getMaxHitPoints, rules/armor.ts#getArmorClass) — nunca impresso como bloco separado. PV máximo: +3 no nível 3, soma mais +1 a cada nível de Feiticeiro posterior (equivalente a +nível a partir do 3º, calculado corretamente mesmo criando o personagem direto num nível superior). Sem armadura: CA = 10 + modificador de Destreza + modificador de Carisma.",
  },
  {
    id: "feiticeiro-draconica-afinidade-elemental-6",
    name: "Afinidade Elemental",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Dracônica",
    level: 6,
    autoGranted: false,
    summary:
      "Escolha obrigatória e duradoura entre Ácido, Elétrico, Fogo, Gelo e Venenoso — resolvida numa etapa PRÓPRIA do Builder ('Afinidade Elemental'), nunca na etapa genérica de Características, porque a fonte não informa troca posterior (tratada como escolha fixa). Concede Resistência ao tipo escolhido; ao conjurar uma magia que cause dano desse tipo, soma o modificador de Carisma em 1 rolagem de dano dessa magia.",
  },
  {
    id: "feiticeiro-draconica-asas-de-dragao-14",
    name: "Asas de Dragão",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Dracônica",
    level: 14,
    autoGranted: true,
    summary: "Ação Bônus: ganha Deslocamento de Voo de 18m por 1 hora. Uso: 1x/Descanso Longo; recuperação alternativa: gastar 3 Pontos de Feitiçaria.",
  },
  {
    id: "feiticeiro-draconica-companheiro-draconico-18",
    name: "Companheiro Dracônico",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Dracônica",
    level: 18,
    autoGranted: true,
    summary:
      "Modifica Invocar Dragão (nota na própria magia, área de Magias — rules/sorcererAutoPreparedSpells.ts — nunca bloco impresso separado): pode conjurá-la sem componente Material, 1x sem gastar espaço por Descanso Longo; pode também conjurá-la sem Concentração, com duração de 1 minuto.",
  },

  // ---------- Feitiçaria Mecânica ----------
  {
    id: "feiticeiro-mecanica-magias-mecanicas-3",
    name: "Magias Mecânicas",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Mecânica",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal (rules/sorcererAutoPreparedSpells.ts — nunca neste campo): nível 3 — Alarme, Auxílio, Proteção Contra o Bem e o Mal, Restauração Menor; nível 5 — Dissipar Magia, Proteção contra Energia; nível 7 — Invocar Constructo, Movimentação Livre; nível 9 — Muralha de Energia, Restauração Maior.",
  },
  {
    id: "feiticeiro-mecanica-restaurar-equilibrio-3",
    name: "Restaurar Equilíbrio",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Mecânica",
    level: 3,
    autoGranted: true,
    summary:
      "Reação: quando uma criatura visível a até 18m vai rolar um d20 com Vantagem ou Desvantagem, remove tanto a Vantagem quanto a Desvantagem dessa jogada. Usos = modificador de Carisma, mínimo 1; recupera todos após Descanso Longo.",
  },
  {
    id: "feiticeiro-mecanica-bastiao-da-lei-6",
    name: "Bastião da Lei",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Mecânica",
    level: 6,
    autoGranted: true,
    summary:
      "Ação (Usar Magia), custo de 1 a 5 Pontos de Feitiçaria: você ou 1 alvo a até 9m ganha um número de dados d8 igual aos Pontos de Feitiçaria gastos. Ao sofrer dano, pode gastar esses dados, rolá-los e reduzir o dano pelo total rolado. Duração: até um Descanso Longo ou até usar de novo.",
  },
  {
    id: "feiticeiro-mecanica-transe-da-ordem-14",
    name: "Transe da Ordem",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Mecânica",
    level: 14,
    autoGranted: true,
    summary:
      "Ação Bônus, duração 1 minuto: durante esse tempo, ataques contra você nunca ganham Vantagem, e qualquer teste de d20 seu que resultar em 9 ou menos é tratado como 10. Uso: 1x/Descanso Longo; recuperação alternativa: gastar 5 Pontos de Feitiçaria.",
  },
  {
    id: "feiticeiro-mecanica-cavalgada-mecanica-18",
    name: "Cavalgada Mecânica",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Mecânica",
    level: 18,
    autoGranted: true,
    summary:
      "Ação (Usar Magia), área de 1 Cubo de 9m: distribui até 100 PV de cura entre as criaturas que escolher; encerra magias de 6º círculo ou inferior em criaturas/objetos escolhidos na área; repara inteiramente objetos danificados na área. Uso: 1x/Descanso Longo; recuperação alternativa: gastar 7 Pontos de Feitiçaria.",
  },

  // ---------- Feitiçaria Selvagem ----------
  {
    id: "feiticeiro-selvagem-mares-do-caos-3",
    name: "Marés do Caos",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Selvagem",
    level: 3,
    autoGranted: true,
    summary:
      "Antes de fazer um teste de d20, pode usar este recurso para ganhar Vantagem nessa jogada. Recupera o uso ao conjurar uma magia de Feiticeiro com espaço de magia, ou após um Descanso Longo. Se conjurar uma magia com espaço antes de recuperar por Descanso Longo (ou seja, logo depois de já ter usado), ocorre automaticamente um Surto de Magia Selvagem e o uso de Marés do Caos é recarregado.",
  },
  {
    id: "feiticeiro-selvagem-surto-de-magia-selvagem-3",
    name: "Surto de Magia Selvagem",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Selvagem",
    level: 3,
    autoGranted: true,
    summary:
      "1x por turno, depois de conjurar uma magia de Feiticeiro usando um espaço de magia, pode rolar 1d20: em um resultado de 20, aplica um efeito da tabela de Surto de Magia Selvagem. Se o efeito for uma magia, ela não recebe nenhuma opção de Metamagia. A tabela completa de Surto de Magia Selvagem NÃO foi fornecida por esta fonte — fica marcada como conteúdo pendente (nunca inventada); ver `data/features/sorcerer.ts`/`rules/sorcererSubclassPrintedFeatures.ts` para o ponto de extensão quando a tabela chegar.",
  },
  {
    id: "feiticeiro-selvagem-distorcer-a-sorte-6",
    name: "Distorcer a Sorte",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Selvagem",
    level: 6,
    autoGranted: true,
    summary:
      "Reação, custo de 1 Ponto de Feitiçaria: depois que outra criatura visível faz um teste de d20, rola 1d4 e aplica o resultado como bônus ou penalidade (+1d4 ou -1d4) ao total daquele teste.",
  },
  {
    id: "feiticeiro-selvagem-caos-controlado-14",
    name: "Caos Controlado",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Selvagem",
    level: 14,
    autoGranted: true,
    summary:
      "Atualiza Surto de Magia Selvagem — nunca um bloco impresso separado. Ao acionar a tabela de Surto, em vez de 1 resultado só, rola 2 vezes e escolhe qual dos 2 resultados aplicar.",
  },
  {
    id: "feiticeiro-selvagem-surto-controlado-18",
    name: "Surto Controlado",
    sourceType: "subclass",
    subclassFullName: "Feitiçaria Selvagem",
    level: 18,
    autoGranted: true,
    summary:
      "Atualiza Surto de Magia Selvagem de novo — nunca um bloco impresso separado. 1x/Descanso Longo, depois de conjurar uma magia de Feiticeiro com espaço de magia, pode escolher o efeito desejado da tabela de Surto de Magia Selvagem em vez de rolar, exceto a última linha da tabela; se o efeito escolhido exigir uma rolagem própria, essa rolagem continua sendo feita normalmente.",
  },

  // ============== PATRULHEIRO — fonte "IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO
  // PDF" ==============
  // Características BASE do Patrulheiro (Inimigo Favorito, Explorador Hábil, Errante, Especialista,
  // Incansável, Predador Implacável, Véu da Natureza, Caçador Preciso, Sentidos Selvagens, Matador
  // de Inimigos Favoritos) continuam pendentes em NAMED_FEATURES_BY_CLASS
  // (data/features/classes.ts) — esta fonte só cobre as 4 SUBCLASSES (Andarilho Feérico, Caçador,
  // Senhor das Feras, Vigilante das Sombras), nunca inventa conteúdo da classe base. "Marca do
  // Predador"/criatura marcada (referenciada pelo Caçador e pelo Senhor das Feras) pressupõe a
  // característica-base "Inimigo Favorito" (pendente) — nunca inventa o que ela faz, só assume a
  // existência da marca, exatamente como a fonte a usa.

  // ---------- Andarilho Feérico ----------
  {
    id: "patrulheiro-feerico-glamour-transcendental-3",
    name: "Glamour Transcendental",
    sourceType: "subclass",
    subclassFullName: "Andarilho Feérico",
    level: 3,
    autoGranted: false,
    summary:
      "Soma modificador de Sabedoria (mínimo +1) a todos os testes de Carisma, incluindo os sem perícia associada — nunca aumenta o próprio Carisma nem afeta Salvaguardas de Carisma, e nunca é multiplicado por Especialização (rules/skills.ts#getGlamourTranscendentalBonus). Exige escolher proficiência em Atuação, Enganação ou Persuasão.",
    choices: [
      {
        id: RANGER_GLAMOUR_SKILL_CHOICE_ID,
        prompt: "Glamour Transcendental: perícia (Atuação, Enganação ou Persuasão)",
        effect: { kind: "skillProficiency", options: ["atuacao", "enganacao", "persuasao"], count: 1, excludeAlreadyProficient: true },
      },
    ],
  },
  {
    id: "patrulheiro-feerico-golpes-terriveis-3",
    name: "Golpes Terríveis",
    sourceType: "subclass",
    subclassFullName: "Andarilho Feérico",
    level: 3,
    autoGranted: true,
    summary:
      "Ao acertar uma criatura com uma arma, 1x em cada um dos seus turnos, pode causar dano Psíquico adicional: 1d4 (1d6 a partir do nível 11, mesmo bloco impresso — nunca 'Golpes Terríveis Aprimorados'). Nunca soma automaticamente a todos os ataques.",
  },
  {
    id: "patrulheiro-feerico-magias-sempre-preparadas-3",
    name: "Magias de Andarilho Feérico",
    sourceType: "subclass",
    subclassFullName: "Andarilho Feérico",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal (rules/rangerAutoPreparedSpells.ts — nunca neste campo): nível 3 — Enfeitiçar Pessoa; nível 5 — Passo Nebuloso; nível 9 — Convocar Feérico; nível 13 — Porta Dimensional; nível 17 — Despistar.",
  },
  {
    id: "patrulheiro-feerico-detalhe-sedutor-7",
    name: "Detalhe Sedutor",
    sourceType: "subclass",
    subclassFullName: "Andarilho Feérico",
    level: 7,
    autoGranted: true,
    summary:
      "Vantagem em Salvaguardas para evitar ou encerrar as condições Amedrontado ou Enfeitiçado. Quando você, ou outra criatura à vista a até 36m, passa numa dessas Salvaguardas, pode usar sua Reação para forçar outra criatura à vista a até 36m a fazer uma Salvaguarda de Sabedoria contra sua CD de magia; falha → fica Amedrontada ou Enfeitiçada (à escolha) por 1 minuto, repetindo a Salvaguarda ao final de cada um dos turnos dela. Condição e alvo são decididos durante o jogo, nunca travados no Builder.",
  },
  {
    id: "patrulheiro-feerico-reforcos-feericos-11",
    name: "Reforços Feéricos",
    sourceType: "subclass",
    subclassFullName: "Andarilho Feérico",
    level: 11,
    autoGranted: true,
    summary:
      "Convocar Feérico pode ser conjurada sem componente Material. Uma vez por Descanso Longo, pode conjurá-la sem gastar espaço de magia. Ao iniciar qualquer conjuração dessa magia (gratuita ou não), pode dispensar a Concentração; nesse caso, a duração passa a ser 1 minuto — essa duração alternativa não se limita ao uso gratuito.",
  },
  {
    id: "patrulheiro-feerico-andarilho-nebuloso-15",
    name: "Andarilho Nebuloso",
    sourceType: "subclass",
    subclassFullName: "Andarilho Feérico",
    level: 15,
    autoGranted: true,
    summary:
      "Pode conjurar Passo Nebuloso sem gastar espaço de magia: modificador de Sabedoria (mínimo 1) vezes por Descanso Longo. Sempre que conjurar essa magia (gratuita ou não), pode levar 1 criatura voluntária à vista a até 1,5m; ela chega a um espaço desocupado a até 1,5m do seu destino.",
  },

  // ---------- Caçador ----------
  {
    id: "patrulheiro-cacador-conhecimento-do-cacador-3",
    name: "Conhecimento do Caçador",
    sourceType: "subclass",
    subclassFullName: "Caçador",
    level: 3,
    autoGranted: true,
    summary:
      "Ao marcar uma criatura com Marca do Predador (Inimigo Favorito), passa a conhecer as Imunidades, Resistências e Vulnerabilidades dela. Nunca cria dados automáticos de monstros — essa informação em si não existe no projeto.",
  },
  {
    id: "patrulheiro-cacador-presa-do-cacador-3",
    name: "Presa do Caçador",
    sourceType: "subclass",
    subclassFullName: "Caçador",
    level: 3,
    autoGranted: true,
    summary:
      "Escolha 1 opção por vez, podendo trocar após um Descanso Curto ou Longo — decisão de jogo, nunca exigida no Builder nem travada no PDF: 1) Assassino de Colossos — 1x em cada um dos seus turnos, acerto com arma contra criatura abaixo do PV máximo causa +1d8; 2) Destruidor de Hordas — 1x em cada um dos seus turnos, ao atacar com uma arma, pode fazer outro ataque com a mesma arma contra uma segunda criatura a até 1,5m da primeira, no alcance da arma, que ainda não tenha sido atacada por você nesse turno.",
  },
  {
    id: "patrulheiro-cacador-taticas-defensivas-7",
    name: "Táticas Defensivas",
    sourceType: "subclass",
    subclassFullName: "Caçador",
    level: 7,
    autoGranted: true,
    summary:
      "Escolha 1 opção por vez, podendo trocar após um Descanso Curto ou Longo — decisão de jogo, nunca exigida no Builder nem travada no PDF: 1) Defesa Contra Ataques Múltiplos — uma criatura que te acerte tem Desvantagem nas demais jogadas de ataque contra você naquele turno; 2) Escapar de Hordas — ataques de oportunidade contra você são feitos com Desvantagem.",
  },
  {
    id: "patrulheiro-cacador-presa-do-cacador-superior-11",
    name: "Presa do Caçador Superior",
    sourceType: "subclass",
    subclassFullName: "Caçador",
    level: 11,
    autoGranted: true,
    summary:
      "Atualiza Marca do Predador — nunca um bloco impresso separado. Uma vez em cada um dos seus turnos, ao causar dano à criatura marcada por Marca do Predador, pode causar o mesmo dano adicional da magia a uma segunda criatura à vista a até 9m da primeira. Nunca inventa o dado da magia (não fornecido pela fonte).",
  },
  {
    id: "patrulheiro-cacador-defesa-do-cacador-superior-15",
    name: "Defesa do Caçador Superior",
    sourceType: "subclass",
    subclassFullName: "Caçador",
    level: 15,
    autoGranted: true,
    summary:
      "Reação ao sofrer dano: ganha Resistência a esse tipo de dano, e a qualquer outro dano do mesmo tipo, até o final do turno atual. Nunca uma Resistência permanente.",
  },

  // ---------- Senhor das Feras ----------
  {
    id: "patrulheiro-feras-companheiro-primal-3",
    name: "Companheiro Primal",
    sourceType: "subclass",
    subclassFullName: "Senhor das Feras",
    level: 3,
    autoGranted: true,
    summary:
      "Uma Fera amigável a você e seus aliados, que obedece aos seus comandos — SEM escolha de animal/aparência/bloco de estatísticas no Builder, e sem ficha de criatura no PDF (fonte explícita: nenhum catálogo registrado). Age no seu turno (pode se mover e usar a própria Reação; sem comando, usa Esquivar). Ação Bônus: ordena 1 ação a ela, OU troca um dos seus próprios ataques da ação Atacar por 1 Golpe da Fera. Se você ficar Incapacitado, ela age por conta própria (sem se limitar a Esquivar); se você morrer, ela desaparece. Se morreu há 1h ou menos, gastando uma ação Usar Magia, tocando-a e gastando 1 espaço de magia, ela revive em 1 minuto com os PV máximos (sem nível mínimo de espaço exigido pela fonte). Após um Descanso Longo, pode reinvocar outra Fera a 1,5m de você — a anterior desaparece.",
  },
  {
    id: "patrulheiro-feras-treinamento-excepcional-7",
    name: "Treinamento Excepcional",
    sourceType: "subclass",
    subclassFullName: "Senhor das Feras",
    level: 7,
    autoGranted: true,
    summary:
      "Atualiza Companheiro Primal — nunca um bloco impresso separado. Ao comandá-la com Ação Bônus, também pode ordenar que ela use a própria Ação Bônus para Ajudar, Correr, Desengajar ou Esquivar. Ao acertar e causar dano, ela pode trocar o tipo normal de dano por Energético.",
  },
  {
    id: "patrulheiro-feras-furia-bestial-11",
    name: "Fúria Bestial",
    sourceType: "subclass",
    subclassFullName: "Senhor das Feras",
    level: 11,
    autoGranted: true,
    summary:
      "Atualiza Companheiro Primal — nunca um bloco impresso separado. O comando de Golpe da Fera passa a permitir executá-lo DUAS vezes, por qualquer uma das formas de comandá-lo. No primeiro acerto da Fera em cada um dos seus turnos contra a criatura marcada por Marca do Predador, causa dano Energético adicional igual ao dano bônus da magia.",
  },
  {
    id: "patrulheiro-feras-compartilhar-magias-15",
    name: "Compartilhar Magias",
    sourceType: "subclass",
    subclassFullName: "Senhor das Feras",
    level: 15,
    autoGranted: true,
    summary: "Quando conjura uma magia em si mesmo, pode fazê-la afetar também sua Fera, se ela estiver a até 9m de você.",
  },

  // ---------- Vigilante das Sombras ----------
  {
    id: "patrulheiro-sombras-emboscador-das-sombras-3",
    name: "Emboscador das Sombras",
    sourceType: "subclass",
    subclassFullName: "Vigilante das Sombras",
    level: 3,
    autoGranted: true,
    summary:
      "Iniciativa passa a usar o modificador de Sabedoria em vez de Destreza, sem mínimo +1 (rules/derived.ts#getInitiative — nunca repetido em Características de Classe). No primeiro turno de cada combate, ganha +3m de deslocamento, só até o final desse turno (nunca um aumento permanente). Golpe Terrível: ao acertar uma criatura com arma, 1x em cada um dos seus turnos, causa dano Psíquico adicional: 2d6 (2d8 a partir do nível 11, mesmo bloco impresso). Usos gratuitos (sem gastar espaço) por Descanso Longo: modificador de Sabedoria, mínimo 1.",
  },
  {
    id: "patrulheiro-sombras-magias-sempre-preparadas-3",
    name: "Magias de Vigilante das Sombras",
    sourceType: "subclass",
    subclassFullName: "Vigilante das Sombras",
    level: 3,
    autoGranted: true,
    summary:
      "Sempre preparadas, não contam contra o limite normal (rules/rangerAutoPreparedSpells.ts — nunca neste campo): nível 3 — Disfarçar-se; nível 5 — Corda Extradimensional; nível 9 — Medo; nível 13 — Invisibilidade Maior; nível 17 — Similaridade.",
  },
  {
    id: "patrulheiro-sombras-visao-umbrosa-3",
    name: "Visão Umbrosa",
    sourceType: "subclass",
    subclassFullName: "Vigilante das Sombras",
    level: 3,
    autoGranted: true,
    summary:
      "Sem Visão no Escuro de outra origem, recebe 18m; com Visão no Escuro de outra origem, o alcance dela aumenta em 18m (rules/rangerSubclassPrintedFeatures.ts — nunca soma a si mesma). Enquanto estiver inteiramente na Escuridão, fica Invisível para criaturas que dependam de Visão no Escuro para vê-lo.",
  },
  {
    id: RANGER_MENTE_DE_FERRO_FEATURE_ID,
    name: "Mente de Ferro",
    sourceType: "subclass",
    subclassFullName: "Vigilante das Sombras",
    level: 7,
    autoGranted: true,
    summary:
      "Concede proficiência em Salvaguardas de Sabedoria. Se já for proficiente em Sabedoria por outra origem (verificado sem considerar esta própria característica — rules/savingThrows.ts#getMenteDeFerroGrantedAbility), escolhe Carisma ou Inteligência no lugar; a escolha só aparece no Builder quando essa condição se aplica (rules/features.ts#getSubclassFeatures). A proficiência final aparece direto nas Salvaguardas, nunca em Características de Classe.",
  },
  {
    id: "patrulheiro-sombras-torrente-do-vigilante-11",
    name: "Torrente do Vigilante",
    sourceType: "subclass",
    subclassFullName: "Vigilante das Sombras",
    level: 11,
    autoGranted: true,
    summary:
      "Ao usar Golpe Terrível, pode adicionar um efeito, à escolha: 1) outro ataque com a mesma arma contra uma segunda criatura a até 1,5m do alvo original, no alcance da arma; 2) o alvo e cada criatura a até 3m dele fazem Salvaguarda de Sabedoria contra sua CD de magia; falha → ficam Amedrontadas até o início do seu próximo turno. Nunca uma seleção permanente nem contador separado; o segundo efeito não se limita a inimigos.",
  },
  {
    id: "patrulheiro-sombras-esquiva-sombria-15",
    name: "Esquiva Sombria",
    sourceType: "subclass",
    subclassFullName: "Vigilante das Sombras",
    level: 15,
    autoGranted: true,
    summary:
      "Reação quando uma criatura faz uma jogada de ataque contra você: impõe Desvantagem a essa jogada; acertando ou errando, pode se teleportar até 9m para um espaço à vista. Sem limite por Descanso.",
  },

  // ---------- Campeão ----------
  {
    id: "guerreiro-campeao-atleta-extraordinario-3",
    name: "Atleta Extraordinário",
    sourceType: "subclass",
    subclassFullName: "Campeão",
    level: 3,
    autoGranted: true,
    summary:
      "Vantagem em testes de Iniciativa e em testes de Força (Atletismo). Imediatamente após conseguir um Acerto Crítico, pode se mover até a metade do deslocamento sem provocar Ataques de Oportunidade — nunca soma esse movimento permanentemente ao deslocamento.",
  },
  {
    id: "guerreiro-campeao-critico-aprimorado-3",
    name: "Crítico Aprimorado",
    sourceType: "subclass",
    subclassFullName: "Campeão",
    level: 3,
    autoGranted: true,
    summary:
      "Ataques com armas e Ataques Desarmados obtêm Acerto Crítico com resultado 19 ou 20 no d20 (nível 15: Crítico Superior substitui esse intervalo por 18–20 — nunca os dois juntos). Aplica-se só aos ataques elegíveis, nunca a ataques de magia.",
  },
  {
    id: "guerreiro-campeao-estilo-de-luta-adicional-7",
    name: "Estilo de Luta Adicional",
    sourceType: "subclass",
    subclassFullName: "Campeão",
    level: 7,
    autoGranted: false,
    summary:
      "Concede mais uma escolha de talento de Estilo de Luta — categoria condicional (`domain/features.ts#FeatureChoiceEffect`, variante `manualText`), SEPARADA da concessão original de Estilo de Luta do Guerreiro nível 1 (origem e quantidade próprias; possuir uma não concede a outra nem todos os Estilos de Luta de uma vez). Catálogo de Estilos de Luta ainda pendente: a escolha abaixo fica como aviso de conteúdo pendente, nunca texto livre validado como talento adquirido.",
    choices: [
      {
        id: FIGHTER_CHAMPION_ADDITIONAL_FIGHTING_STYLE_CHOICE_ID,
        prompt: "Campeão nível 7 — Estilo de Luta Adicional (catálogo de Estilos de Luta ainda pendente)",
        effect: { kind: "manualText", placeholder: "Estilo de Luta Adicional (catálogo pendente)" },
      },
    ],
  },
  {
    id: "guerreiro-campeao-combatente-heroico-10",
    name: "Combatente Heroico",
    sourceType: "subclass",
    subclassFullName: "Campeão",
    level: 10,
    autoGranted: true,
    summary:
      "Durante combate, no início de cada um dos seus turnos, se não tiver Inspiração Heroica, pode recebê-la. Nunca cria contador por Descanso nem permite acúmulo além do comportamento já existente de Inspiração Heroica.",
  },
  {
    id: "guerreiro-campeao-critico-superior-15",
    name: "Crítico Superior",
    sourceType: "subclass",
    subclassFullName: "Campeão",
    level: 15,
    autoGranted: true,
    summary:
      "Atualiza Crítico Aprimorado — nunca um bloco impresso separado. O intervalo de Acerto Crítico em ataques com armas e Ataques Desarmados passa a 18–20, substituindo por completo o intervalo anterior (nunca os dois juntos).",
  },
  {
    id: "guerreiro-campeao-sobrevivente-18",
    name: "Sobrevivente",
    sourceType: "subclass",
    subclassFullName: "Campeão",
    level: 18,
    autoGranted: true,
    summary:
      "Vantagem em Salvaguardas Contra a Morte; nessa salvaguarda, um resultado de 18 a 20 no d20 é tratado como 20. No início de cada um dos seus turnos, se estiver Sangrando e com pelo menos 1 PV, recupera 5 + modificador de Constituição em PV. Usa a definição de \"Sangrando\" já cadastrada no projeto — NENHUMA definição estruturada dessa condição existe hoje, então fica registrada como condição textual, com a falta de automação sinalizada como pendência (nunca inventada). Nunca aplica um mínimo de cura não fornecido pela fonte.",
  },

  // ---------- Cavaleiro Místico ----------
  {
    id: "guerreiro-cavaleiro-mistico-conjuracao-3",
    name: "Conjuração",
    sourceType: "subclass",
    subclassFullName: "Cavaleiro Místico",
    level: 3,
    autoGranted: true,
    summary:
      "Atributo de conjuração: Inteligência (já reconhecido por rules/spellcasting.ts via SUBCLASS_SPELLCASTERS). Pode usar Foco Arcano. Conhece 2 truques da lista de Mago (3 a partir do nível 10 — rules/classResources.ts#getCantripsKnown); ao ganhar nível de Guerreiro, pode substituir um truque. Prepara inicialmente 3 magias de 1º círculo da lista de Mago, com progressão própria de Magias Preparadas/espaços (rules/classResources.ts#getSpellsPreparedMax, rules/spellcasting.ts#getSpellSlots — numericamente igual à progressão de terço-conjurador, mas registrada à parte); magias escolhidas precisam ter círculo para o qual a progressão concede espaços; ao ganhar nível de Guerreiro, pode substituir uma magia preparada por outra elegível; espaços gastos são recuperados em Descanso Longo. Recomendações (NUNCA concessões automáticas nem escolhas obrigatórias): truques Raio de Gelo e Toque Chocante; magias Escudo Arcano, Mãos Flamejantes e Salto. Sem catálogo completo de magias no projeto: truques e magias preparadas usam o mesmo campo de texto livre já existente para todo conjurador, nunca validados só pelo nome digitado. Não impresso em Características de Classe — usa os campos próprios de Conjuração.",
  },
  {
    id: "guerreiro-cavaleiro-mistico-vinculo-com-arma-3",
    name: "Vínculo com Arma",
    sourceType: "subclass",
    subclassFullName: "Cavaleiro Místico",
    level: 3,
    autoGranted: true,
    summary:
      "Ritual de 1 hora (pode ocorrer durante um Descanso Curto) com uma arma ao alcance durante o ritual, tocada ao concluir: vincula até 2 armas. Falha se a arma já estiver vinculada a outro Guerreiro ou, sendo mágica, estiver sintonizada com outra pessoa. Não pode ser desarmado de uma arma vinculada, salvo se estiver Incapacitado. Ação Bônus invoca uma arma vinculada para a mão, se estiver no mesmo plano de existência. Um novo vínculo além do limite de 2 exige encerrar um vínculo anterior. Nunca exige escolha de arma vinculada na criação do personagem — decisão feita durante o jogo.",
  },
  {
    id: "guerreiro-cavaleiro-mistico-magia-de-guerra-7",
    name: "Magia de Guerra",
    sourceType: "subclass",
    subclassFullName: "Cavaleiro Místico",
    level: 7,
    autoGranted: true,
    summary:
      "Na ação Atacar do próprio turno, pode substituir um dos ataques por um truque de Mago com tempo de conjuração de uma ação (nível 18: Magia de Guerra Aprimorada acrescenta a opção de substituir dois ataques por uma magia de 1º ou 2º círculo — preservando esta opção do truque).",
  },
  {
    id: "guerreiro-cavaleiro-mistico-golpe-mistico-10",
    name: "Golpe Místico",
    sourceType: "subclass",
    subclassFullName: "Cavaleiro Místico",
    level: 10,
    autoGranted: true,
    summary:
      "Ao acertar uma criatura com uma arma, ela fica com Desvantagem na próxima salvaguarda contra uma magia conjurada pelo personagem antes do fim do próximo turno dele. Nunca Desvantagem permanente nem em todas as salvaguardas.",
  },
  {
    id: "guerreiro-cavaleiro-mistico-investida-mistica-15",
    name: "Investida Mística",
    sourceType: "subclass",
    subclassFullName: "Cavaleiro Místico",
    level: 15,
    autoGranted: true,
    summary:
      "Ao usar Surto de Ação, pode teleportar até 9m para um espaço desocupado à vista, antes ou depois da ação adicional. Nunca cria um contador separado de Surto de Ação — reutiliza os usos já existentes dessa característica do Guerreiro.",
  },
  {
    id: "guerreiro-cavaleiro-mistico-magia-de-guerra-aprimorada-18",
    name: "Magia de Guerra Aprimorada",
    sourceType: "subclass",
    subclassFullName: "Cavaleiro Místico",
    level: 18,
    autoGranted: true,
    summary:
      "Atualiza Magia de Guerra — nunca um bloco impresso separado. Na ação Atacar do próprio turno, também pode substituir dois ataques por uma magia de Mago de 1º ou 2º círculo com tempo de conjuração de uma ação, preservando a opção anterior de substituir um ataque por um truque.",
  },

  // ---------- Guerreiro Psiônico ----------
  {
    id: "guerreiro-psionico-energia-psionica-3",
    name: "Energia Psiônica",
    sourceType: "subclass",
    subclassFullName: "Guerreiro Psiônico",
    level: 3,
    autoGranted: true,
    summary:
      "Reserva de Dados de Energia Psiônica: d6 x4 no nível 3; d8 x6 no 5; d8 x8 no 9; d10 x8 no 11; d10 x10 no 13; d12 x12 no 17 (rules/classResources.ts#getPsiWarriorDie/getPsiWarriorDiceCount). Recupera um dado gasto em Descanso Curto; recupera todos em Descanso Longo. Só os dados desta subclasse alimentam os poderes abaixo — nunca somados a DS (Mestre de Batalha) ou a dados de outra origem. Um poder que exige gasto de dado nunca pode ser usado sem dado disponível.",
  },
  {
    id: "guerreiro-psionico-golpe-psionico-3",
    name: "Golpe Psiônico",
    sourceType: "subclass",
    subclassFullName: "Guerreiro Psiônico",
    level: 3,
    autoGranted: true,
    summary:
      "Uma vez no próprio turno, imediatamente após acertar um alvo a até 9m e causar dano com arma: gasta 1 dado de Energia Psiônica e causa dano Energético adicional igual ao dado + modificador de Inteligência. Nunca soma a todos os ataques nem aplica mínimo não fornecido (nível 7: Estocada Telecinética acrescenta uma Salvaguarda de Força opcional ao causar esse dano — mesmo bloco impresso, nunca separado).",
  },
  {
    id: "guerreiro-psionico-movimento-telecinetico-3",
    name: "Movimento Telecinético",
    sourceType: "subclass",
    subclassFullName: "Guerreiro Psiônico",
    level: 3,
    autoGranted: true,
    summary:
      "Ação Usar Magia: escolhe um objeto solto Grande ou menor, ou outra criatura voluntária, à vista a até 9m, e o transporta até 9m para um espaço desocupado à vista (um objeto Minúsculo também pode ser transportado de ou para a própria mão). Um uso por Descanso Curto ou Longo; gastar 1 dado de Energia Psiônica, sem ação, recupera o uso. Nunca pode ser usado tendo o próprio personagem como criatura-alvo.",
  },
  {
    id: "guerreiro-psionico-vinculo-protetivo-3",
    name: "Vínculo Protetivo",
    sourceType: "subclass",
    subclassFullName: "Guerreiro Psiônico",
    level: 3,
    autoGranted: true,
    summary:
      "Reação quando você, ou outra criatura à vista a até 9m, sofre dano: gasta 1 dado de Energia Psiônica e reduz o dano em dado + modificador de Inteligência, no mínimo 1.",
  },
  {
    id: "guerreiro-psionico-estocada-telecinetica-7",
    name: "Estocada Telecinética",
    sourceType: "subclass",
    subclassFullName: "Guerreiro Psiônico",
    level: 7,
    autoGranted: true,
    summary:
      "Atualiza Golpe Psiônico — nunca um bloco impresso separado. Ao causar dano com Golpe Psiônico, pode exigir que o alvo faça uma Salvaguarda de Força, CD própria = 8 + BP + modificador de Inteligência (fórmula independente da CD de magia — rules/psionics.ts#getKineticThrustCd); falha: o alvo fica Caído, ou é deslocado horizontalmente até 3m, à escolha. Sem gasto adicional de dado; condição ou movimento são escolhidos no momento do uso.",
  },
  {
    id: "guerreiro-psionico-salto-com-impulsao-psiquica-7",
    name: "Salto com Impulsão Psíquica",
    sourceType: "subclass",
    subclassFullName: "Guerreiro Psiônico",
    level: 7,
    autoGranted: true,
    summary:
      "Ação Bônus: concede a si mesmo voo igual a duas vezes o deslocamento efetivo até o fim do turno. Um uso por Descanso Curto ou Longo; gastar 1 dado de Energia Psiônica, sem ação, recupera o uso. Nunca adiciona voo permanente à ficha.",
  },
  {
    id: "guerreiro-psionico-resguardo-mental-10",
    name: "Resguardo Mental",
    sourceType: "subclass",
    subclassFullName: "Guerreiro Psiônico",
    level: 10,
    autoGranted: true,
    summary:
      "Resistência a dano Psíquico (aplicada pelo sistema textual de resistências já existente, preservando outras origens). No início de cada um dos seus turnos, se estiver Amedrontado ou Enfeitiçado, pode gastar 1 dado de Energia Psiônica, sem ação, para encerrar TODOS os efeitos que impõem essas condições.",
  },
  {
    id: "guerreiro-psionico-baluarte-de-energia-15",
    name: "Baluarte de Energia",
    sourceType: "subclass",
    subclassFullName: "Guerreiro Psiônico",
    level: 15,
    autoGranted: true,
    summary:
      "Ação Bônus: escolhe até máximo(1, modificador de Inteligência) criaturas a até 9m, incluindo a si mesmo, e concede Cobertura Parcial por 1 minuto (termina antes se o personagem ficar Incapacitado). Um uso por Descanso Longo; gastar 1 dado de Energia Psiônica, sem ação, recupera o uso. Nunca aplica bônus permanente de CA; reutiliza a regra de Cobertura Parcial já existente no projeto, sem inventar seus efeitos.",
  },
  {
    id: "guerreiro-psionico-mestre-telecinetico-18",
    name: "Mestre Telecinético",
    sourceType: "subclass",
    subclassFullName: "Guerreiro Psiônico",
    level: 18,
    autoGranted: true,
    summary:
      "Telecinese fica sempre preparada, usando Inteligência como atributo de conjuração (referência registrada mesmo sem catálogo completo de magias — nunca cria espaços de magia só por esta característica). Uma conjuração gratuita por Descanso Longo, sem espaço nem componentes; gastar 1 dado de Energia Psiônica, sem ação, recupera esse uso. Em cada turno mantendo Concentração nela, inclusive no turno da própria conjuração, pode fazer um ataque com arma usando Ação Bônus.",
  },

  // ---------- Mestre da Batalha ----------
  {
    id: "guerreiro-mestre-de-batalha-estudioso-da-guerra-3",
    name: "Estudioso da Guerra",
    sourceType: "subclass",
    subclassFullName: "Mestre da Batalha",
    level: 3,
    autoGranted: false,
    summary:
      "Concede proficiência em 1 Ferramenta de Artesão e em 1 perícia entre as opções de perícia do Guerreiro no nível 1. Reutiliza os catálogos já existentes (data/tools.ts/rules/tools.ts#getEligibleTools; perícias de Guerreiro) — nunca inventa ferramentas nem amplia a lista de perícias. Aplicada nos campos próprios de proficiência; nunca impressa em Características de Classe.",
    choices: [
      {
        id: "guerreiro-mestre-de-batalha-estudioso-da-guerra-ferramenta-escolha",
        prompt: "Estudioso da Guerra — escolha 1 Ferramenta de Artesão",
        effect: { kind: "toolProficiency", category: "artisanTool", count: 1 },
      },
      {
        id: FIGHTER_BATTLE_MASTER_ESTUDIOSO_SKILL_CHOICE_ID,
        prompt: "Estudioso da Guerra — escolha 1 perícia entre as opções de Guerreiro",
        effect: { kind: "skillProficiency", options: classes.guerreiro.skillChoice!.from, count: 1, excludeAlreadyProficient: true },
      },
    ],
  },
  {
    id: "guerreiro-mestre-de-batalha-superioridade-em-combate-3",
    name: "Superioridade em Combate",
    sourceType: "subclass",
    subclassFullName: "Mestre da Batalha",
    level: 3,
    autoGranted: true,
    summary:
      "Reserva de Dados de Superioridade (DS): 4 d8 nos níveis 3–6; 5 d8 nos níveis 7–9; 5 d10 nos níveis 10–14; 6 d10 nos níveis 15–17; 6 d12 nos níveis 18–20 (rules/classResources.ts#getSuperiorityDie/getSuperiorityDiceCount). Cada uso de manobra gasta 1 DS, salvo uso de Implacável (nível 15). Recupera todos os DS em Descanso Curto ou Longo. Apenas 1 manobra por ataque. Ao aprender novas manobras (subetapa própria \"Manobras\"), pode substituir uma conhecida. CD de Manobras = 8 + BP + maior entre os modificadores de Força e Destreza, calculada automaticamente a cada vez (rules/maneuvers.ts#getManeuversCd) — nunca uma escolha apresentada ao jogador, nunca persistida como cópia separada; recalcula sozinha sempre que Força, Destreza ou BP mudarem.",
  },
  {
    id: "guerreiro-mestre-de-batalha-conheca-seu-inimigo-7",
    name: "Conheça Seu Inimigo",
    sourceType: "subclass",
    subclassFullName: "Mestre da Batalha",
    level: 7,
    autoGranted: true,
    summary:
      "Ação Bônus: examina uma criatura à vista a até 9m e revela suas Imunidades, Resistências e Vulnerabilidades. Um uso por Descanso Longo; pode gastar 1 DS, sem ação, para recuperar um uso. Nunca inventa informações de criaturas — o projeto não tem catálogo de monstros.",
  },
  {
    id: "guerreiro-mestre-de-batalha-implacavel-15",
    name: "Implacável",
    sourceType: "subclass",
    subclassFullName: "Mestre da Batalha",
    level: 15,
    autoGranted: true,
    summary:
      "Uma vez por turno, ao usar uma manobra, pode rolar 1d8 em vez de gastar 1 DS. Esse d8 não consome a reserva de DS, não exige DS restante, e nunca vira d10/d12 nos níveis seguintes (mantém d8 fixo até o nível 20). Mantém a ação e as demais condições da manobra usada; não concede usos gratuitos de Conheça Seu Inimigo (que não é manobra); preserva a regra de 1 manobra por ataque.",
  },
];
