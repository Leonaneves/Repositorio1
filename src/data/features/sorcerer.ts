import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Características de CLASSE do Feiticeiro, estruturadas a partir da
 * fonte "INTEGRAÇÃO COMPLETA — FEITICEIRO, METAMAGIA E SUBCLASSES" —
 * substitui as entradas genéricas que existiam antes em
 * `NAMED_FEATURES_BY_CLASS.feiticeiro` (nome+nível pendente de
 * conteúdo).
 *
 * Mesma `FeatureDefinition` por característica mesmo quando ela evolui
 * em nível posterior (Feitiçaria Inata recebe Feitiçaria Encarnada no
 * 7 e Apoteose Arcana no 20; Fonte de Magia recebe Restauração
 * Feiticeira no 5) — a evolução fica no texto impresso dinâmico
 * (`rules/sorcererPrintedFeatures.ts`), nunca numa segunda
 * `FeatureDefinition`. "Restauração Feiticeira", "Feitiçaria
 * Encarnada" e "Apoteose Arcana" têm `FeatureDefinition` própria
 * (nomes reais da fonte), mas NUNCA criam bloco impresso separado.
 *
 * "Metamagia" aqui é só a feature informativa — a mecânica real
 * (quantidade conhecida por nível, catálogo de opções, substituição ao
 * subir de nível) vive em `data/metamagic.ts` + `rules/metamagic.ts` +
 * a etapa própria do Builder (`ui/builder/steps/StepMetamagic.tsx`),
 * nunca num `FeatureChoice` genérico — mesmo raciocínio já aplicado a
 * Invocações Místicas do Bruxo e Formas Conhecidas do Druida.
 *
 * Omitidas de propósito do campo impresso (continuam existindo como
 * `FeatureDefinition`, só não aparecem em "Características de Classe"
 * — ver `rules/sorcererPrintedFeatures.ts`): "Conjuração", "Subclasse
 * de Feiticeiro" (estrutural, etapa 3 do Builder), "Aumento no Valor
 * de Atributo" e "Dádiva Épica" (sistema de Talentos/ASI genérico, já
 * cobre o Feiticeiro via `ASI_LEVELS_BY_CLASS`/`DADIVA_EPICA_CLASSES`).
 */

export const sorcererClassFeatures: FeatureDefinition[] = [
  {
    id: "feiticeiro-conjuracao-1",
    name: "Conjuração",
    sourceType: "class",
    classId: "feiticeiro",
    level: 1,
    autoGranted: true,
    summary:
      "Conjuração completa (atributo Carisma, foco Foco Arcano). Prepara magias da lista de Feiticeiro — quantidade de Truques/Magias Preparadas conforme o nível (rules/classResources.ts#getCantripsKnown/#getSpellsPreparedMax). Ao subir de nível, pode substituir 1 magia preparada por outra elegível. Magias sempre preparadas por outra característica (Magias das 4 subclasses) não contam contra o limite normal, mas contam como magias de Feiticeiro. Truques/Magias Preparadas/Espaços/CD/Ataque de magia/magias sempre preparadas ficam todos na área de Magias, nunca neste campo.",
  },
  {
    id: "feiticeiro-feiticaria-inata-1",
    name: "Feitiçaria Inata",
    sourceType: "class",
    classId: "feiticeiro",
    level: 1,
    autoGranted: true,
    summary:
      "Ação Bônus, duração 1 minuto: enquanto ativa, a CD das magias de Feiticeiro soma +1 e as jogadas de Ataque de magia de Feiticeiro ganham Vantagem. Usos: 2, recupera todos após Descanso Longo. A partir do nível 7 (Feitiçaria Encarnada — mesma característica, nunca um bloco separado): se não houver usos restantes, pode gastar 2 Pontos de Feitiçaria como Ação Bônus para ativá-la mesmo assim; enquanto ativa, até 2 opções de Metamagia podem modificar a mesma magia. A partir do nível 20 (Apoteose Arcana — mesma característica, nunca um bloco separado): 1 vez por turno, pode usar 1 opção de Metamagia sem gastar Pontos de Feitiçaria (nunca torna TODAS as Metamagias gratuitas, só 1 por turno).",
  },
  {
    id: "feiticeiro-fonte-de-magia-2",
    name: "Fonte de Magia",
    sourceType: "class",
    classId: "feiticeiro",
    level: 2,
    autoGranted: true,
    summary:
      "Reserva de Pontos de Feitiçaria (PF) — quantidade máxima conforme o nível (rules/classResources.ts#getSorceryPoints — tabela já registrada, nível 2 = 2 PF); recupera todos após Descanso Longo. Sem ação: pode gastar 1 espaço de magia e ganhar PF iguais ao círculo do espaço gasto, nunca ultrapassando o máximo. Ação Bônus: pode gastar PF para criar 1 espaço de magia (custo e nível mínimo por círculo — rules/sorceryPoints.ts#SPELL_SLOT_CREATION_COSTS: 1º=2PF/Nv2+, 2º=3PF/Nv3+, 3º=5PF/Nv5+, 4º=6PF/Nv7+, 5º=7PF/Nv9+); nunca cria espaço acima do 5º círculo; espaços criados desse jeito desaparecem após um Descanso Longo. PF nunca ocupa um checkbox por ponto no PDF — aparece como contador 'PF: ___/{PFMax}', com o máximo resolvido.",
  },
  {
    id: "feiticeiro-metamagia-2",
    name: "Metamagia",
    sourceType: "class",
    classId: "feiticeiro",
    level: 2,
    autoGranted: true,
    summary:
      "Escolhe opções de Metamagia conhecidas: 2 (níveis 2-9), 4 (níveis 10-16), 6 (níveis 17-20) — etapa própria do Builder ('Metamagia'), nunca um FeatureChoice genérico; ao subir de nível, pode substituir 1 opção conhecida por outra que ainda não conheça. Normalmente só 1 opção de Metamagia pode modificar a mesma magia, exceto Magia Buscadora e Magia Potencializada, que podem ser usadas mesmo que outra Metamagia já tenha sido usada na mesma conjuração (ver data/metamagic.ts para o catálogo completo e rules/metamagic.ts para a validação de quantidade).",
  },
  {
    id: "feiticeiro-restauracao-feiticeira-5",
    name: "Restauração Feiticeira",
    sourceType: "class",
    classId: "feiticeiro",
    level: 5,
    autoGranted: true,
    summary:
      "Atualiza Fonte de Magia — nunca cria um bloco impresso separado. Após um Descanso Curto, 1x/Descanso Longo, pode recuperar Pontos de Feitiçaria já gastos, até metade do nível de Feiticeiro (arredondado para baixo).",
  },
  {
    id: "feiticeiro-feiticaria-encarnada-7",
    name: "Feitiçaria Encarnada",
    sourceType: "class",
    classId: "feiticeiro",
    level: 7,
    autoGranted: true,
    summary:
      "Atualiza Feitiçaria Inata — nunca um bloco impresso separado. Se não houver usos restantes de Feitiçaria Inata, pode gastar 2 Pontos de Feitiçaria como Ação Bônus para ativá-la mesmo assim. Enquanto Feitiçaria Inata estiver ativa, até 2 opções de Metamagia podem modificar a mesma magia (atualiza a regra geral de Metamagia, item 11 da fonte).",
  },
  {
    id: "feiticeiro-apoteose-arcana-20",
    name: "Apoteose Arcana",
    sourceType: "class",
    classId: "feiticeiro",
    level: 20,
    autoGranted: true,
    summary:
      "Atualiza Feitiçaria Inata — nunca um bloco impresso separado. Enquanto Feitiçaria Inata estiver ativa, 1x por turno pode usar 1 opção de Metamagia sem gastar Pontos de Feitiçaria — nunca torna todas as Metamagias gratuitas, só a 1 usada naquele turno.",
  },
];
