import { useCharacterStore } from "../../../state/characterStore.js";
import { useBuilderStore } from "../../../state/builderStore.js";
import { BACKGROUND_IDS } from "../../../domain/ids.js";
import { backgrounds, getBackgroundAbilityAllocationConfig } from "../../../data/backgrounds.js";
import { skills } from "../../../data/skills.js";
import { hasHumanOriginFeatConflictWithBackground } from "../../../rules/feats.js";
import { useBuildChoiceRecommendations } from "../../../services/useBuildChoiceRecommendations.js";
import { withRecommendedLabel } from "../../../services/useTalentRecommendations.js";
import { RecommendationReasonsHint } from "../RecommendationReasonsHint.js";

/**
 * Etapa 5 — escolha de antecedente, informações e benefícios já
 * cadastrados. A DISTRIBUIÇÃO dos Aumentos de Atributo do Antecedente
 * não acontece mais aqui (fonte "REORGANIZAR O BUILDER E CORRIGIR
 * VALIDAÇÕES EXISTENTES" §3: "a escolha de quais atributos aumentar
 * deve acontecer somente na etapa Atributos") — só um aviso apontando
 * para lá. O estado (`backgroundAbilityBonuses`) e as regras
 * (`getBackgroundAbilityAllocationConfig`) continuam exatamente como
 * antes; só a UI de distribuição mudou de lugar.
 *
 * Conflito com o Talento de Origem do Humano (fonte "ADICIONAR ESCOLHA
 * DE TALENTO DE ORIGEM DO HUMANO NA ETAPA ESPÉCIE" §3): como Espécie
 * vem ANTES de Antecedente na ordem do Builder, é aqui — ao escolher ou
 * trocar o Antecedente — que o conflito pode surgir; o aviso aponta de
 * volta para a etapa Espécie, nunca sugere trocar o Antecedente (a fonte
 * pede explicitamente que o lado trocado seja o do Humano).
 */
export function Step5Background() {
  const character = useCharacterStore((s) => s.character);
  const goToStep = useBuilderStore((s) => s.goToStep);
  const backgroundId = character.backgroundId;
  const setBackground = useCharacterStore((s) => s.setBackground);

  const config = backgroundId ? getBackgroundAbilityAllocationConfig(backgroundId) : null;
  const hasConflict = hasHumanOriginFeatConflictWithBackground(character);
  const recommendedBackgrounds = useBuildChoiceRecommendations({ kind: "background" }, BACKGROUND_IDS);

  return (
    <div className="builder-step" aria-label="Antecedente">
      <label className="field">
        <span>Antecedente</span>
        <select
          value={backgroundId ?? ""}
          onChange={(e) => setBackground(e.target.value ? (e.target.value as (typeof BACKGROUND_IDS)[number]) : null)}
        >
          <option value="">- Selecione -</option>
          {BACKGROUND_IDS.map((id) => (
            <option key={id} value={id}>
              {withRecommendedLabel(backgrounds[id].name, recommendedBackgrounds.get(id))}
            </option>
          ))}
        </select>
      </label>
      <RecommendationReasonsHint reasons={recommendedBackgrounds} nameOf={(id) => backgrounds[id as (typeof BACKGROUND_IDS)[number]].name} />
      {backgroundId && (
        <p className="builder-step__hint">
          Perícias: {backgrounds[backgroundId].grantedSkills.map((skillId) => skills[skillId].name).join(", ")}
          <br />
          Talento de Origem: {backgrounds[backgroundId].originFeat}
        </p>
      )}

      {config && (
        <p className="builder-step__hint">
          Aumentos de Atributo disponíveis: {config.eligibleAbilities.join(", ")} (distribua {config.totalPoints}{" "}
          {config.totalPoints === 1 ? "ponto" : "pontos"}, máximo +{config.maxPerAbility} por atributo). Distribua os aumentos na etapa Atributos.
        </p>
      )}

      {hasConflict && (
        <p className="builder-step__hint builder-step__hint--warning">
          O Talento de Origem do Humano é o mesmo concedido por este Antecedente e não é repetível — troque o Talento de Origem do Humano na etapa Espécie.{" "}
          <button type="button" className="review-edit-button" onClick={() => goToStep("species")}>
            Editar em Espécie
          </button>
        </p>
      )}
    </div>
  );
}
