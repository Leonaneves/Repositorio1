import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Características da classe BASE do Mago, estruturadas a partir da
 * fonte "IMPLEMENTAR MAGO E SUAS SUBCLASSES NO BUILDER E NO PDF" —
 * substitui as entradas genéricas que existiam antes em
 * `NAMED_FEATURES_BY_CLASS.mago` (nome+nível pendente de conteúdo),
 * mesmo padrão já usado para Guerreiro/Patrulheiro/Ladino
 * (`data/features/fighter.ts`/`ranger.ts`/`rogue.ts`). As 4 SUBCLASSES
 * (`data/features/subclasses.ts` + `rules/wizardSubclassPrintedFeatures.ts`)
 * são desta MESMA fonte.
 *
 * Omitido de propósito do campo impresso (continua existindo como
 * `FeatureDefinition`, só não aparece em "Características de Classe"):
 * "Acadêmico" (nível 2) — a escolha de Especialização mora na etapa
 * própria "Perícias" e aparece lá; "Conjuração" — atributo/CD/espaços/
 * truques/livro já têm campos próprios na área de Magias; "Subclasse
 * de Mago" (estrutural, etapa Classe), "Aumento no Valor de Atributo" e
 * "Dádiva Épica" (sistema de Talentos/ASI genérico, já cobre o Mago via
 * `ASI_LEVELS_BY_CLASS`/`DADIVA_EPICA_CLASSES`).
 */

export const WIZARD_ACADEMIC_CHOICE_ID = "mago-academico-escolha";
export const WIZARD_ACADEMIC_SKILL_OPTIONS = ["arcanismo", "historia", "investigacao", "medicina", "natureza", "religiao"] as const;

export const wizardClassFeatures: FeatureDefinition[] = [
  {
    id: "mago-conjuracao-1",
    name: "Conjuração",
    sourceType: "class",
    classId: "mago",
    level: 1,
    autoGranted: true,
    summary:
      "Atributo de conjuração: Inteligência (rules/spellcasting.ts). Pode usar Foco Arcano OU o livro de magias como foco (descritivo — nunca mencionado no PDF, que não cita componentes). Truques conhecidos: 3 no nível 1, 4 no nível 4, 5 no nível 10 (rules/classResources.ts#getCantripsKnown); em cada Descanso Longo, pode substituir um truque desta característica por outro de Mago. Luz/Mãos Mágicas/Raio de Gelo são só recomendações, nunca concessões automáticas. O livro de magias é um objeto Minúsculo, 1,5 quilo, 100 páginas, legível pelo personagem ou por quem conjure Identificar (aparência/materiais descritivos, sem escolha mecânica obrigatória) — (rules/wizardSpellbook.ts) começa com 6 magias de 1º círculo à escolha e recebe mais 2 a cada nível de Mago posterior (getWizardSpellbookClassGrantCount) — separado da preparação (character.wizardSpellbook[].prepared); inicialmente prepara 4 magias do livro, seguindo rules/classResources.ts#getSpellsPreparedMax, sem somar INT. Espaços de magia recuperados em Descanso Longo (rules/spellcasting.ts#getSpellSlots). Nunca inventa custos, tempos ou regras de cópia de magias no livro (não fornecidos). Recomendações (NUNCA concessões automáticas) para as 6 magias iniciais do livro: Armadura Arcana, Detectar Magia, Mísseis Mágicos, Onda Trovejante, Queda Suave, Sono.",
  },
  {
    id: "mago-adepto-de-ritual-1",
    name: "Adepto de Ritual",
    sourceType: "class",
    classId: "mago",
    level: 1,
    autoGranted: true,
    summary:
      "Pode conjurar como Ritual qualquer magia com o marcador Ritual presente no livro de magias, mesmo sem estar preparada — exige ler o livro durante essa conjuração. Nunca concede Ritual a uma magia sem esse marcador.",
  },
  {
    id: "mago-recuperacao-arcana-1",
    name: "Recuperação Arcana",
    sourceType: "class",
    classId: "mago",
    level: 1,
    autoGranted: true,
    summary:
      "Ao completar um Descanso Curto, estudando o livro de magias, pode recuperar espaços de magia gastos — soma dos círculos recuperados limitada à metade do nível de Mago, arredondada para cima (rules/classResources.ts#getArcaneRecoveryLimit: nível 1 = 1, nível 5 = 3, nível 20 = 10), cada espaço recuperado entre 1º e 5º círculo. Um uso por Descanso Longo. Nunca recupera espaços acima do máximo disponível nem cria espaços adicionais; o Descanso Curto só ativa a recuperação, nunca restaura o próprio uso.",
  },
  {
    id: "mago-academico-2",
    name: "Acadêmico",
    sourceType: "class",
    classId: "mago",
    level: 2,
    autoGranted: false,
    summary:
      "Escolhe 1 perícia, dentre Arcanismo/História/Investigação/Medicina/Natureza/Religião, na qual já seja proficiente, para ganhar Especialização (dobra o Bônus de Proficiência) — resolvido na etapa própria \"Perícias\" (domain/features.ts#FeatureChoiceEffect, variante `skillExpertise` com `options` restrito a estas 6). Sem opção elegível (nenhuma das 6 proficiente ainda), a etapa sinaliza a situação sem conceder proficiência nem ampliar a lista.",
    choices: [
      {
        id: WIZARD_ACADEMIC_CHOICE_ID,
        prompt: "Acadêmico — escolha 1 perícia proficiente (Arcanismo/História/Investigação/Medicina/Natureza/Religião) para Especialização",
        effect: { kind: "skillExpertise", count: 1, options: [...WIZARD_ACADEMIC_SKILL_OPTIONS] },
      },
    ],
  },
  {
    id: "mago-memorizar-magia-5",
    name: "Memorizar Magia",
    sourceType: "class",
    classId: "mago",
    level: 5,
    autoGranted: true,
    summary:
      "Ao completar um Descanso Curto, estudando o livro de magias, pode substituir uma magia preparada pela característica Conjuração por outra do livro — ambas de 1º círculo ou superior, respeitando a elegibilidade de preparação normal. Nunca substitui truques nem magias sempre preparadas por outras características. Sem contador por descanso — é uma possibilidade disponível a cada Descanso Curto, nunca limitada a usos.",
  },
  {
    id: "mago-maestria-de-magias-18",
    name: "Maestria de Magias",
    sourceType: "class",
    classId: "mago",
    level: 18,
    autoGranted: true,
    summary:
      "Escolhe no livro 1 magia de 1º círculo e 1 de 2º círculo, ambas com tempo de conjuração de uma ação (character.wizardSpellbook[].isSpellMastery) — ficam sempre preparadas, fora do limite normal, e podem ser conjuradas sem espaço no círculo base; conjurar em círculo superior exige gastar espaço normalmente. Em Descanso Longo, estudando o livro, pode substituir uma das 2 escolhas por outra elegível do mesmo círculo. Configuração alterável em descanso — nunca uma exigência permanente de criação nem nomes fixados em Características de Classe. As conjurações gratuitas no círculo base não têm limite de usos — nenhum marcador.",
  },
  {
    id: "mago-assinatura-magica-20",
    name: "Assinatura Mágica",
    sourceType: "class",
    classId: "mago",
    level: 20,
    autoGranted: true,
    summary:
      "Escolhe no livro 2 magias DISTINTAS de 3º círculo (character.wizardSpellbook[].isSignatureSpell) — ficam sempre preparadas, fora do limite normal; cada uma pode ser conjurada 1 vez no 3º círculo sem gastar espaço, recuperando o uso em Descanso Curto OU Longo, com um contador PRÓPRIO e independente por magia (rules/wizardClassPrintedFeatures.ts). Conjurar em círculo superior ao 3º exige espaço normalmente. Nunca uma troca em descanso para estas 2 escolhas (diferente de Maestria de Magias) — integradas à área de Magias, identificadas pela origem Assinatura Mágica, nunca duplicadas no catálogo/lista para representar a conjuração gratuita.",
  },
];
