import type { AbilityKey } from "./common.js";
import type { ArmorId, BackgroundId, ClassId, SkillKey, SpeciesId } from "./ids.js";

/**
 * Origem de onde cada talento/escolha foi CONCEDIDA — reaproveita o
 * mesmo vocabulário de `FeatureDefinition.sourceType` (ver
 * `domain/features.ts`), restrito aos 4 valores que de fato concedem
 * oportunidades de Talento/Estilo de Luta/Dádiva Épica (nunca "feat":
 * esse `sourceType` identifica a FEATURE RESULTANTE de uma aquisição de
 * talento, não a origem da OPORTUNIDADE em si — ver
 * `rules/talentAcquisitionHistory.ts`).
 */
export type TalentGrantOrigin = "class" | "subclass" | "species" | "background";

/**
 * TIPO da oportunidade de talento (fonte "IMPLEMENTAR RECOMENDAÇÕES DE
 * TALENTOS" — primeiro escopo): define qual catálogo vale para a escolha
 * e é a primeira dimensão de comparação do recomendador — uma escolha
 * de Estilo de Luta nunca é comparada com uma de Talento Geral, mesmo
 * com classe/nível iguais.
 *
 * - `originFeat`: Talento de Origem — o do Humano (traço Versátil,
 *   `opportunityId: "species"`, voluntário) ou o do Antecedente
 *   (`"background"`, concedido automaticamente, `voluntary: false` —
 *   só contexto, nunca recomendado nem contado como escolha);
 * - `generalFeat`: Talento escolhido num nível de ASI (`"asi-{nível}"`);
 * - `fightingStyle`: Estilo de Luta (id da `FeatureChoice` do ponto de concessão);
 * - `epicBoon`: Dádiva Épica (id da `FeatureChoice` de nível 19).
 */
export type TalentOpportunityKind = "originFeat" | "generalFeat" | "fightingStyle" | "epicBoon";

export const TALENT_OPPORTUNITY_KINDS: readonly TalentOpportunityKind[] = ["originFeat", "generalFeat", "fightingStyle", "epicBoon"];

/**
 * Contexto do personagem IMEDIATAMENTE ANTES de aplicar os benefícios
 * da PRÓPRIA aquisição — nunca inclui a contribuição dela mesma nem de
 * qualquer aquisição de nível POSTERIOR (fonte "IMPLEMENTAR A BASE DE
 * DADOS PARA FUTURAS RECOMENDAÇÕES" §3: "não usar benefícios de
 * escolhas posteriores para representar o contexto de uma aquisição
 * anterior"). Calculado por `rules/talentAcquisitionHistory.ts`
 * reutilizando a MESMA lógica de `rules/feats.ts#getAbilityScoreForPrerequisite`
 * usada para validar pré-requisitos em ordem histórica.
 */
export interface TalentAcquisitionContext {
  /** Os 6 atributos como estavam neste ponto — nunca o valor final/atual do personagem. */
  abilityScores: Record<AbilityKey, number>;
  classId: ClassId | null;
  /**
   * "desconhecido" quando a aquisição não tem nível numérico associado
   * (Antecedente/Humano, concedidos na criação, antes de qualquer
   * progressão) ou quando o nível da aquisição é anterior ao nível 3
   * (subclasse ainda não podia ter sido escolhida nesse ponto) — nunca
   * presume a subclasse ATUAL como se already fosse a de então.
   */
  subclassId: string | null | "desconhecido";
  /** Nível do personagem nesta aquisição — `null` para Antecedente/Humano (sem nível de ASI associado). */
  level: number | null;
}

/**
 * Uma aquisição registrada de Talento Geral, Talento de Origem, Estilo
 * de Luta ou Dádiva Épica — ver `rules/talentAcquisitionHistory.ts`.
 * `opportunityId` é a identidade ESTÁVEL da oportunidade em si
 * (`acquisitionKey` de `rules/feats.ts#FeatAcquisition` — `"background"`/
 * `"species"`/`"asi-{nível}"` — ou o id da `FeatureChoice` de Estilo de
 * Luta/Dádiva Épica), o que preserva aquisições distintas de um mesmo
 * talento REPETÍVEL (Habilidoso/Iniciado em Magia) como registros
 * separados, nunca fundidos.
 */
export interface TalentAcquisitionRecord {
  /** Id do talento/Estilo de Luta/Dádiva Épica escolhido (catálogo de `data/features/feats.ts`, `data/fightingStyles.ts` ou `data/features/epicBoons.ts`). */
  talentId: string;
  opportunityId: string;
  /** Ver `TalentOpportunityKind`. Registros gravados antes deste campo existir não o têm — quem lê o banco deriva o tipo a partir de `opportunityId` (ver `recommendations/opportunityKind.ts#deriveOpportunityKind`). */
  opportunityKind: TalentOpportunityKind;
  grantOrigin: TalentGrantOrigin;
  acquisitionLevel: number | null;
  /** `false` só para o Talento de Origem fixo do Antecedente (o jogador não escolhe QUAL) — todas as demais oportunidades são `true`. */
  voluntary: boolean;
  /** Escolhas internas desta aquisição (perícias/ferramentas de Habilidoso, lista de Iniciado em Magia etc.), chaveadas pelo id-BASE da `FeatureChoice` (sem o sufixo de `acquisitionKey`) — `{}` quando o talento não tem nenhuma. */
  internalChoices: Record<string, string | string[]>;
  /** Atributo aumentado por esta aquisição, quando ela concede "+1/+2 num atributo" — `null` quando não se aplica ou a escolha ainda não foi resolvida. */
  abilityIncreased: AbilityKey | null;
  context: TalentAcquisitionContext;
}

/** Identificação da fonte de um registro de referência importado (fonte "IMPLEMENTAR A BASE DE DADOS..." §2) — a importação em si é de uma etapa futura; isto só prepara onde ela será guardada. */
export interface CharacterBuildReferenceSource {
  /** Identificador livre da fonte externa (ex.: nome/URL/versão do material de onde o registro veio). */
  sourceId: string;
  /** "extracted" = conteúdo extraído de uma fonte real; "synthetic" = gerado artificialmente para preencher amostra — nunca confundidos. */
  contentType: "extracted" | "synthetic";
}

/**
 * Representação ANÔNIMA e ESTRUTURADA de um personagem em construção,
 * usada exclusivamente para estatísticas agregadas da comunidade (ver
 * `services/mapCharacterToBuild.ts`, `repositories/CharacterBuildRepository.ts`
 * e `analytics/`).
 *
 * Só é gravado quando o jogador CONFIRMA o personagem na Revisão
 * (`services/publishConfirmedCharacter.ts`) — rascunhos nunca saem do
 * navegador. Cada confirmação é um registro NOVO e imutável (nunca
 * atualizado depois): editar e confirmar de novo cria outra versão do
 * mesmo `characterId`, e um personagem novo nunca altera os anteriores.
 *
 * Só existem aqui campos ESTRUTURADOS relevantes para analisar
 * escolhas de criação — nunca texto livre nem qualquer coisa que
 * identifique a pessoa (ver a lista negativa explícita em
 * `services/mapCharacterToBuild.ts`).
 *
 * `origin`/`status` (fonte "IMPLEMENTAR A BASE DE DADOS PARA FUTURAS
 * RECOMENDAÇÕES" §2): `origin` distingue um personagem real
 * (`"user"`, sempre o que `mapCharacterToBuild` produz) de um registro
 * de referência importado (`"reference"`, nunca produzido por
 * `mapCharacterToBuild` — a importação é de uma etapa futura).
 * `status` distingue um personagem ainda em edição (`"draft"`, o
 * padrão — nunca presumido como confirmado só por não ter mais
 * pendências) de um que o jogador confirmou explicitamente na Revisão
 * (`"confirmed"`, ver `services/buildConfirmation.ts`). As estatísticas
 * de escolhas reais (`repositories/*`) só consideram
 * `origin === "user" && status === "confirmed"`.
 */
export interface CharacterBuild {
  /** Id DESTA versão confirmada (chave primária do registro) — cada confirmação gera um novo; nunca reaproveitado. */
  buildId: string;
  /**
   * Id estável do PERSONAGEM (o próprio `Character.id`, UUID gerado no
   * navegador, sem vínculo com identidade real). Várias confirmações do
   * mesmo personagem (ex.: confirmar, editar, confirmar de novo) viram
   * várias versões com o mesmo `characterId` — as estatísticas contam só
   * a MAIS RECENTE de cada personagem (fonte "CONFIRMAR PERSONAGENS SEM
   * ALTERAR OS ANTERIORES").
   */
  characterId: string;

  origin: "user" | "reference";
  status: "draft" | "confirmed";
  /** Só preenchido quando `origin === "reference"` — `null` para qualquer build real de usuário. */
  referenceSource: CharacterBuildReferenceSource | null;

  level: number;
  classId: ClassId | null;
  subclassId: string | null;
  speciesId: SpeciesId | null;
  backgroundId: BackgroundId | null;

  abilityScores: Record<AbilityKey, number>;

  skillProficiencies: SkillKey[];
  skillExpertise: SkillKey[];
  /**
   * Perícias escolhidas em CADA escolha de perícia (proficiência ou
   * Especialização), pelo id da `FeatureChoice` (ex.: as "Perícias de
   * Classe" do Bárbaro) — diferente de `skillProficiencies`, que mistura
   * tudo que o personagem tem (Antecedente, espécie etc.). Base das
   * recomendações de Perícias/Especialização. `{}` em registros gravados
   * antes deste campo existir.
   */
  skillChoices: Record<string, SkillKey[]>;
  savingThrowProficiencies: AbilityKey[];
  /** Opções de Metamagia conhecidas (Feiticeiro — ids de `data/metamagic.ts`), na ordem escolhida. Base da recomendação de Metamagia. `[]` em registros gravados antes deste campo existir. */
  metamagicOptions: string[];
  /** Invocações Místicas escolhidas (Bruxo — ids de `data/invocations.ts`). Base da recomendação de Invocações. `[]` antes deste campo existir. */
  invocationIds: string[];
  /** Manobras escolhidas (Mestre de Batalha — ids de `data/maneuvers.ts`). Base da recomendação de Manobras. `[]` antes deste campo existir. */
  maneuverIds: string[];

  armorId: ArmorId | null; // null = sem armadura
  shield: boolean;

  /** Atributo de conjuração efetivo (derivado pelo motor de regras — inclui o fallback de antecedente). `null` se o personagem não conjura. */
  spellcastingAbility: AbilityKey | null;

  /** Talentos Gerais/de Origem, Estilos de Luta e Dádiva Épica adquiridos, cada um com origem/nível/contexto histórico — ver `TalentAcquisitionRecord`. */
  talentAcquisitions: TalentAcquisitionRecord[];

  updatedAt: string; // ISO 8601, momento da confirmação no navegador (o banco também registra `confirmed_at` pelo próprio relógio)
}
