import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Características da classe BASE do Monge, estruturadas a partir da
 * fonte "IMPLEMENTAR MONGE E SUAS SUBCLASSES NO BUILDER E NO PDF" —
 * substitui as entradas genéricas que existiam antes em
 * `NAMED_FEATURES_BY_CLASS.monge` (nome+nível pendente de conteúdo),
 * mesmo padrão já usado para Guerreiro/Patrulheiro/Ladino/Mago
 * (`data/features/fighter.ts`/`ranger.ts`/`rogue.ts`/`wizard.ts`). As 4
 * SUBCLASSES (`data/features/subclasses.ts` +
 * `rules/monkSubclassPrintedFeatures.ts`) são desta MESMA fonte.
 *
 * "Golpes Potencializados" (6), "Foco Aprimorado" (10) e "Defletir
 * Energia" (13) e "Foco Perfeito" (15) têm `FeatureDefinition` própria
 * (nomes reais da fonte), mas NUNCA criam bloco impresso separado — só
 * atualizam o bloco de Artes Marciais/Foco do Monge/Defletir
 * Ataques/Metabolismo Incomum já existente
 * (rules/monkClassPrintedFeatures.ts).
 *
 * "Movimento sem Armadura" (nível 2) JÁ EXISTE em
 * `mechanicalClassFeatures` (data/features/classes.ts), com conteúdo
 * correto e completo — omitida deste arquivo de propósito, nunca
 * reconstruída aqui, para nunca duplicar id/conteúdo.
 *
 * Omitido de propósito do campo impresso (continua existindo como
 * `FeatureDefinition`, só não aparece em "Características de Classe"):
 * "Subclasse de Monge" (estrutural, etapa Classe), "Aumento no Valor de
 * Atributo" e "Dádiva Épica" (sistema de Talentos/ASI genérico, já
 * cobre o Monge via `ASI_LEVELS_BY_CLASS`/`DADIVA_EPICA_CLASSES`).
 */

export const monkClassFeatures: FeatureDefinition[] = [
  {
    id: "monge-artes-marciais-1",
    name: "Artes Marciais",
    sourceType: "class",
    classId: "monge",
    level: 1,
    autoGranted: true,
    summary:
      "Armas de Monge: arma Simples corpo a corpo + arma Marcial corpo a corpo Leve (data/weapons.ts). Com Ataque Desarmado ou arma de Monge, sem armadura e sem escudo: (1) Ação Bônus para 1 Ataque Desarmado adicional, nunca exigindo a Ação de Atacar antes; (2) pode trocar o dado de dano normal pelo dado de Artes Marciais (rules/classResources.ts#getMartialArtsDie — 1d6 níveis 1-4, 1d8 níveis 5-10, 1d10 níveis 11-16, 1d12 níveis 17-20), de forma OPCIONAL, nunca uma troca obrigatória para um dado menor; (3) pode usar Destreza em vez de Força na jogada de ataque e dano com essas armas, E na CD de Empurrar/Agarrar do Ataque Desarmado — automatiza o modificador mais favorável, sem eliminar a alternativa válida de Força. A partir do nível 6 (Golpes Potencializados): o Ataque Desarmado também pode causar dano Energético.",
  },
  {
    id: "monge-defesa-sem-armadura-1",
    name: "Defesa sem Armadura",
    sourceType: "class",
    classId: "monge",
    level: 1,
    autoGranted: true,
    summary: "CA = 10 + mod Destreza + mod Sabedoria (rules/armor.ts), sem armadura e sem escudo — nunca soma com outra fórmula de CA base.",
  },
  {
    id: "monge-foco-do-monge-2",
    name: "Foco do Monge",
    sourceType: "class",
    classId: "monge",
    level: 2,
    autoGranted: true,
    summary:
      "Reserva ÚNICA de Foco (rules/classResources.ts#getFocusPoints — nenhum Foco no nível 1, quantidade = nível de Monge a partir do nível 2, recupera-se por completo em Descanso Curto OU Longo, NUNCA calculada pelo BP). Opções, usáveis no próprio turno: Defesa Paciente — Ação Bônus para Desengajar de graça, OU gasta 1 Foco para Desengajar+Esquivar na mesma Ação Bônus; Passo do Vento — Ação Bônus para Disparada de graça, OU gasta 1 Foco para Disparada+Desengajar na mesma Ação Bônus, dobrando a distância de salto durante o turno; Torrente de Golpes — Ação Bônus + 1 Foco para 2 Ataques Desarmados, nunca exigindo a Ação de Atacar antes. CD de efeitos de Foco e das Salvaguardas de classe do Monge: rules/classResources.ts#getMonkFocusCd (8 + mod Sabedoria + BP), calculada automaticamente — nunca confundida com a CD de Empurrar/Agarrar do Ataque Desarmado. A partir do nível 10 (Foco Aprimorado): Defesa Paciente também concede PV Temp ao gastar Foco; Passo do Vento também pode levar 1 aliado voluntário junto ao gastar Foco; Torrente de Golpes passa a conceder 3 Ataques Desarmados em vez de 2 — tudo pelo MESMO custo, sem título impresso separado.",
  },
  {
    id: "monge-metabolismo-incomum-2",
    name: "Metabolismo Incomum",
    sourceType: "class",
    classId: "monge",
    level: 2,
    autoGranted: true,
    summary:
      "Ao rolar Iniciativa, pode recuperar todo o Foco já gasto E curar PV = dado de Artes Marciais + nível de Monge (rules/classResources.ts#getUnusualMetabolismHealingText). Um uso por Descanso Longo. Nunca aplicado na criação do personagem nem ao aumentar o PV máximo. A partir do nível 15 (Foco Perfeito): em uma rolagem de Iniciativa em que NÃO usar esta característica, se o Foco atual for menor que 4, recupera Foco até 4 — nunca concede 4 pontos adicionais aos já existentes, nunca um título impresso separado.",
  },
  {
    id: "monge-defletir-ataques-3",
    name: "Defletir Ataques",
    sourceType: "class",
    classId: "monge",
    level: 3,
    autoGranted: true,
    summary:
      "Reação, ao sofrer dano de um ataque cujo dano inclua Contundente, Cortante ou Perfurante: reduz o dano TOTAL desse ataque em 1d10 + mod Destreza + nível de Monge (rules/classResources.ts#getDeflectAttacksReductionText). Se a redução zerar o dano, pode gastar 1 Foco para redirecioná-lo: origem corpo a corpo — 1 criatura a até 1,5m; origem à distância — 1 criatura a até 18m sem Cobertura Total; o alvo faz Salvaguarda de Destreza contra a CD de Foco (rules/classResources.ts#getMonkFocusCd); falha: duas rolagens do dado de Artes Marciais + mod Destreza (rules/classResources.ts#getDeflectAttacksRedirectDamageText), do MESMO tipo de dano do ataque original. Nunca reduz à metade em caso de sucesso. A partir do nível 13 (Defletir Energia): a mesma fórmula passa a valer contra QUALQUER tipo de dano, substituindo a restrição de tipo acima.",
  },
  {
    id: "monge-queda-lenta-4",
    name: "Queda Lenta",
    sourceType: "class",
    classId: "monge",
    level: 4,
    autoGranted: true,
    summary: "Reação durante uma queda: reduz o dano de queda sofrido em 5 × nível de Monge (rules/classResources.ts#getSlowFallReduction). Nunca um recurso limitado por descanso.",
  },
  {
    id: "monge-ataque-extra-5",
    name: "Ataque Extra",
    sourceType: "class",
    classId: "monge",
    level: 5,
    autoGranted: true,
    summary: "Ataca duas vezes, em vez de uma, ao usar a Ação de Atacar no próprio turno (rules/classResources.ts#getExtraAttacksCount). Nunca somado a um benefício equivalente de outra classe.",
  },
  {
    id: "monge-golpe-atordoante-5",
    name: "Golpe Atordoante",
    sourceType: "class",
    classId: "monge",
    level: 5,
    autoGranted: true,
    summary:
      "Uma vez por turno, ao acertar um ataque com arma de Monge ou Ataque Desarmado, pode gastar 1 Foco: o alvo faz Salvaguarda de Constituição contra a CD de Foco (rules/classResources.ts#getMonkFocusCd); falha: Atordoado até o início do próximo turno do Monge; sucesso: deslocamento do alvo reduzido à metade até esse momento, E o próximo ataque contra ele antes disso tem Vantagem. Nunca limitado ao próprio turno do Monge.",
  },
  {
    id: "monge-golpes-potencializados-6",
    name: "Golpes Potencializados",
    sourceType: "class",
    classId: "monge",
    level: 6,
    autoGranted: true,
    summary:
      "Atualiza Artes Marciais — nunca um bloco impresso separado. Ao causar dano com Ataque Desarmado, pode escolher causar dano Energético em vez do tipo normal, escolhido a cada uso, nunca substituindo permanentemente o tipo de dano.",
  },
  {
    id: "monge-evasao-7",
    name: "Evasão",
    sourceType: "class",
    classId: "monge",
    level: 7,
    autoGranted: true,
    summary:
      "Em um efeito que permita Salvaguarda de Destreza para sofrer metade do dano: sucesso = nenhum dano, falha = metade. Fica indisponível enquanto o Monge estiver Incapacitado. Nunca aplicada indiscriminadamente a qualquer Salvaguarda de Destreza.",
  },
  {
    id: "monge-movimento-acrobatico-9",
    name: "Movimento Acrobático",
    sourceType: "class",
    classId: "monge",
    level: 9,
    autoGranted: true,
    summary:
      "Sem armadura e sem escudo, pode se mover no próprio turno por superfícies verticais e por líquidos, sem cair durante esse movimento. Nunca concede voo nem sustentação permanente ao fim do movimento.",
  },
  {
    id: "monge-foco-aprimorado-10",
    name: "Foco Aprimorado",
    sourceType: "class",
    classId: "monge",
    level: 10,
    autoGranted: true,
    summary:
      "Atualiza as 3 opções de Foco do Monge — nunca um título impresso separado. Defesa Paciente: ao gastar Foco, também concede PV Temp = duas rolagens do dado de Artes Marciais (rules/classResources.ts#getImprovedPatientDefenseTempHpText). Passo do Vento: ao gastar Foco, também pode levar 1 criatura voluntária Grande ou menor a até 1,5m junto, até o fim do turno, sem provocar Ataque de Oportunidade pelo movimento dela — nunca estendendo esta proteção ao próprio Monge. Torrente de Golpes: passa a custar a mesma Ação Bônus + 1 Foco para TRÊS Ataques Desarmados, em vez de dois.",
  },
  {
    id: "monge-restauro-pessoal-10",
    name: "Restauro Pessoal",
    sourceType: "class",
    classId: "monge",
    level: 10,
    autoGranted: true,
    summary:
      "Ao fim de cada um dos próprios turnos, pode remover de si mesmo as condições Atordoado, Enfeitiçado e Envenenado. Nunca sofre Exaustão por falta de comida ou água. Nunca concede imunidade geral a Exaustão.",
  },
  {
    id: "monge-defletir-energia-13",
    name: "Defletir Energia",
    sourceType: "class",
    classId: "monge",
    level: 13,
    autoGranted: true,
    summary:
      "Atualiza Defletir Ataques — nunca uma reserva ou bloco impresso separado. Substitui a restrição de tipo de dano (Contundente/Cortante/Perfurante) por QUALQUER tipo de dano, preservando redução, custo, alcance e demais condições já descritas.",
  },
  {
    id: "monge-sobrevivente-disciplinado-14",
    name: "Sobrevivente Disciplinado",
    sourceType: "class",
    classId: "monge",
    level: 14,
    autoGranted: true,
    summary:
      "Concede proficiência em TODAS as Salvaguardas (rules/savingThrows.ts), aplicada direto nos campos de Salvaguarda, preservando qualquer proficiência já concedida por outra origem. Além disso, após falhar em uma Salvaguarda, pode gastar 1 Foco para refazer a rolagem — DEVE usar o novo resultado.",
  },
  {
    id: "monge-foco-perfeito-15",
    name: "Foco Perfeito",
    sourceType: "class",
    classId: "monge",
    level: 15,
    autoGranted: true,
    summary:
      "Atualiza Metabolismo Incomum — nunca um título impresso separado. Ao rolar Iniciativa sem usar Metabolismo Incomum, se o Foco atual for menor que 4, recupera Foco até 4 (nunca concede 4 pontos adicionais aos já existentes).",
  },
  {
    id: "monge-defesa-superior-18",
    name: "Defesa Superior",
    sourceType: "class",
    classId: "monge",
    level: 18,
    autoGranted: true,
    summary:
      "No início do próprio turno, pode gastar 3 Foco: ganha Resistência a todo tipo de dano, exceto Força, por 1 minuto ou até ficar Incapacitado. Nunca exige Ação Bônus nem se torna uma Resistência permanente.",
  },
  {
    id: "monge-corpo-e-mente-20",
    name: "Corpo e Mente",
    sourceType: "class",
    classId: "monge",
    level: 20,
    autoGranted: true,
    summary:
      "Aumenta Destreza e Sabedoria em 4 cada, até o máximo de 25, aplicado uma única vez (rules/abilities.ts#getEffectiveAbilityScore) — recalcula automaticamente TODOS os valores derivados (CA, ataques, Salvaguardas, perícias, Iniciativa, CD de Foco, curas, usos baseados em Sabedoria). Removido corretamente se o nível cair abaixo de 20.",
  },
];
