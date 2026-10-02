import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Características de CLASSE do Bruxo, estruturadas a partir da fonte
 * "INTEGRAÇÃO COMPLETA — BRUXO, INVOCAÇÕES MÍSTICAS E SUBCLASSES" —
 * substitui as entradas genéricas que existiam antes em
 * `NAMED_FEATURES_BY_CLASS.bruxo` (nome+nível pendente de conteúdo).
 *
 * "Invocações Místicas" aqui é só a FeatureDefinition informativa —
 * a mecânica real (quantidade por nível, pré-requisitos, repetibilidade)
 * vive em `data/invocations.ts` + `rules/invocations.ts` + a etapa
 * própria do Builder (`ui/builder/steps/StepInvocations.tsx`), nunca
 * num `FeatureChoice` genérico — a elegibilidade cruzada entre
 * invocações/Pactos não cabe no modelo genérico de "N opções fixas".
 *
 * "Arcana Mística" aparece 4 vezes (níveis 11/13/15/17) de propósito —
 * mesmo padrão já usado para "Maestria em Arma" do Bárbaro: cada
 * arcanum é uma escolha independente (sem catálogo de magias no
 * projeto — a escolha real continua na lista manual de Magias
 * Preparadas, com um checkbox de uso 1/DL anotado em `notes`).
 */
export const warlockClassFeatures: FeatureDefinition[] = [
  {
    id: "bruxo-magia-de-pacto-1",
    name: "Magia de Pacto",
    sourceType: "class",
    classId: "bruxo",
    level: 1,
    autoGranted: true,
    summary:
      "Sistema de conjuração PRÓPRIO do Bruxo — nunca a progressão comum de espaços de magia. Todos os espaços de Magia de Pacto são sempre do mesmo círculo (o círculo atual da tabela de progressão, rules/classResources.ts#getPactMagicSlotCount via rules/spellcasting.ts#getSpellSlots com casterKind 'pact'); uma magia de círculo inferior conjurada com Magia de Pacto usa o espaço no círculo atual. Recuperação: todos os espaços após Descanso Curto OU Longo. Atributo de conjuração: Carisma. Foco: Foco Arcano. Magias Preparadas (círculo máximo = círculo atual de Pacto) e substituições ao subir de nível ficam na área de Magias, nunca neste campo.",
  },
  {
    id: "bruxo-invocacoes-misticas-1",
    name: "Invocações Místicas",
    sourceType: "class",
    classId: "bruxo",
    level: 1,
    autoGranted: true,
    summary:
      "Quantidade máxima conforme o nível (rules/classResources.ts#getInvocationsKnown). Resolvida numa etapa própria do Builder ('Invocações Místicas'), nunca como FeatureChoice genérico — cada invocação tem pré-requisitos próprios (nível/Pacto/outra invocação) e algumas são repetíveis com sub-escolha (Truque afetado, Talento de Origem). Ver data/invocations.ts + rules/invocations.ts.",
  },
  {
    id: "bruxo-astucia-magica-2",
    name: "Astúcia Mágica",
    sourceType: "class",
    classId: "bruxo",
    level: 2,
    autoGranted: true,
    summary:
      "Rito de 1 minuto, 1×/Descanso Longo: recupera metade da quantidade máxima de espaços de Magia de Pacto (arredondado para cima) já gastos. A partir do nível 20 (Mestre Místico), a MESMA característica passa a recuperar TODOS os espaços — nunca um bloco separado.",
  },
  {
    id: "bruxo-contatar-patrono-9",
    name: "Contatar Patrono",
    sourceType: "class",
    classId: "bruxo",
    level: 9,
    autoGranted: true,
    summary:
      "Contato Extraplanar fica sempre preparada (entra automaticamente na área de Magias, rules/warlockAutoPreparedSpells.ts). Uso especial: 1×/Descanso Longo, sem gastar espaço, com a finalidade específica de contato com o patrono e sucesso automático na salvaguarda da magia.",
  },
  {
    id: "bruxo-arcana-mistica-6",
    name: "Arcana Mística",
    sourceType: "class",
    classId: "bruxo",
    level: 11,
    autoGranted: true,
    summary:
      "Escolha 1 magia de Bruxo de 6º círculo (arcanum) — NÃO cria espaço de Magia de Pacto; 1 uso próprio, recupera após Descanso Longo. Sem catálogo de magias no projeto: a escolha é feita na lista manual de Magias Preparadas da área de Magias, com o uso anotado em notas. Ao subir de nível, pode substituir por outra magia de Bruxo do mesmo círculo (6º).",
  },
  {
    id: "bruxo-arcana-mistica-7",
    name: "Arcana Mística",
    sourceType: "class",
    classId: "bruxo",
    level: 13,
    autoGranted: true,
    summary: "Mais 1 arcanum: 1 magia de Bruxo de 7º círculo, mesma regra do arcanum de 6º círculo (sem espaço, 1 uso/Descanso Longo).",
  },
  {
    id: "bruxo-arcana-mistica-8",
    name: "Arcana Mística",
    sourceType: "class",
    classId: "bruxo",
    level: 15,
    autoGranted: true,
    summary: "Mais 1 arcanum: 1 magia de Bruxo de 8º círculo, mesma regra dos arcana anteriores.",
  },
  {
    id: "bruxo-arcana-mistica-9",
    name: "Arcana Mística",
    sourceType: "class",
    classId: "bruxo",
    level: 17,
    autoGranted: true,
    summary: "Mais 1 arcanum: 1 magia de Bruxo de 9º círculo, mesma regra dos arcana anteriores.",
  },
  {
    id: "bruxo-mestre-mistico-20",
    name: "Mestre Místico",
    sourceType: "class",
    classId: "bruxo",
    level: 20,
    autoGranted: true,
    summary: "Astúcia Mágica passa a recuperar TODOS os espaços de Magia de Pacto gastos, em vez de metade — atualiza o mesmo bloco de Astúcia Mágica, nunca um bloco separado.",
  },
];
