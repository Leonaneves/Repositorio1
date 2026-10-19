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
 * `buildId` não tem qualquer relação com identidade real — é gerado no
 * navegador (mesmo `Character.id`) e reaproveitado enquanto o jogador
 * edita ESTE personagem; trocar de classe/subclasse/espécie etc. várias
 * vezes atualiza o mesmo registro (upsert por `buildId`), em vez de
 * criar um registro novo a cada alteração (ver §6 do pedido do
 * usuário). Um personagem novo (`resetCharacter`) gera um `buildId`
 * novo.
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
  buildId: string;

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
  savingThrowProficiencies: AbilityKey[];

  armorId: ArmorId | null; // null = sem armadura
  shield: boolean;

  /** Atributo de conjuração efetivo (derivado pelo motor de regras — inclui o fallback de antecedente). `null` se o personagem não conjura. */
  spellcastingAbility: AbilityKey | null;

  /** Talentos Gerais/de Origem, Estilos de Luta e Dádiva Épica adquiridos, cada um com origem/nível/contexto histórico — ver `TalentAcquisitionRecord`. */
  talentAcquisitions: TalentAcquisitionRecord[];

  updatedAt: string; // ISO 8601, atribuído pelo repositório no momento do upsert
}
