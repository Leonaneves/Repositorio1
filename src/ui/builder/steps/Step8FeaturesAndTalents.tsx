import { useState } from "react";
import { useCharacterStore } from "../../../state/characterStore.js";
import { useBuilderStore } from "../../../state/builderStore.js";
import { ABILITY_KEYS, type AbilityKey } from "../../../domain/common.js";
import { getFeaturesAndTalentsStepFeatures, getFeatureView, isSkillKindChoice } from "../../../rules/features.js";
import { ASI_ALLOCATION_CONFIG, getUnlockedAsiLevels } from "../../../rules/asi.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "../../../rules/abilities.js";
import { FeatureChoiceControl } from "../FeatureChoiceControl.js";
import { AsiControl } from "../AsiControl.js";
import { AbilityPointAllocator } from "../../components/AbilityPointAllocator.js";
import { useAbilityRecommendations } from "../../../services/useBuildChoiceRecommendations.js";
import { AbilityRecommendationsHint } from "../RecommendationReasonsHint.js";

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

/**
 * Etapa 6 do fluxo canônico (rótulo "Talentos", id interno
 * `"featuresAndTalents"` preservado — fonte "REESTRUTURAR A ESCOLHA DE
 * TALENTOS PARA OCORRER APÓS OS ATRIBUTOS" §1/§5), posicionada depois de
 * Atributos e antes de Perícias. Reúne, nesta ordem:
 *
 * (1) um resumo compacto dos 6 atributos (§5: "mostrar um resumo
 * compacto dos 6 atributos durante esta etapa" — só leitura, a edição
 * continua em Atributos);
 * (2) as concessões automáticas de Espécie/Antecedente/Talento já
 * resolvidas e as oportunidades de Estilo de Luta/Dádiva Épica, MOVIDAS
 * de Classe/Subclasse (`getFeaturesAndTalentsStepFeatures`, que já
 * inclui ambas — ver `rules/features.ts`) — cada uma com o
 * `FeatureChoiceControl` genérico de sempre, preservando a identificação
 * "Origem: Humano" + atalho para Espécie (fonte "ADICIONAR ESCOLHA DE
 * TALENTO DE ORIGEM DO HUMANO NA ETAPA ESPÉCIE" §2) e o atalho para
 * Perícias quando a feature tiver escolha de perícia misturada;
 * (3) a DECISÃO + distribuição/escolha de cada ASI já desbloqueado
 * (`AsiControl`, MOVIDO de Classe, mais o `AbilityPointAllocator`,
 * MOVIDO de Atributos, quando o modo for "Aumentar Atributos") — com o
 * toggle "Mostrar talentos indisponíveis" (§7) controlando se o
 * `<select>` de cada `AsiControl` lista só os elegíveis ou todos com o
 * motivo.
 */
export function Step8FeaturesAndTalents() {
  const character = useCharacterStore((s) => s.character);
  const goToStep = useBuilderStore((s) => s.goToStep);
  const increaseAsiAbility = useCharacterStore((s) => s.increaseAsiAbility);
  const decreaseAsiAbility = useCharacterStore((s) => s.decreaseAsiAbility);
  const [showUnavailableFeats, setShowUnavailableFeats] = useState(false);
  // Rótulos de recomendação nos aumentos de ASI: a distribuição GERAL dos jogadores (maior, 2º maior, menor).
  const abilityRecommendations = useAbilityRecommendations();

  const features = getFeaturesAndTalentsStepFeatures(character);
  const unlockedAsiLevels = getUnlockedAsiLevels(character);

  return (
    <div className="builder-step" aria-label="Talentos">
      <section className="feature-card" aria-label="Resumo de Atributos">
        <h3>Atributos (resumo)</h3>
        <div className="ability-draft-grid">
          {ABILITY_KEYS.map((ability) => {
            const score = getEffectiveAbilityScore(character, ability);
            const modifier = getAbilityModifier(score);
            return (
              <div className="field" key={ability}>
                <span>{ABILITY_NAMES[ability]}</span>
                <span>
                  {score} ({modifier >= 0 ? "+" : ""}
                  {modifier})
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {features.length === 0 && unlockedAsiLevels.length === 0 && <p className="empty-note">Nenhuma escolha pendente neste momento.</p>}

      {features.map((feature) => {
        const view = getFeatureView(feature);
        const isHumanOriginFeat = feature.sourceType === "feat" && feature.speciesId === "humano";
        const nonSkillChoices = (feature.choices ?? []).filter((choice) => !isSkillKindChoice(choice));
        const hasSkillChoices = (feature.choices ?? []).some(isSkillKindChoice);
        return (
          <article key={feature.id} className="feature-card">
            <h3>{view.name}</h3>
            <p className="feature-card__origin">
              {isHumanOriginFeat ? "Origem: Humano" : view.originLabel}
              {isHumanOriginFeat && (
                <>
                  {" — "}
                  <button type="button" className="review-edit-button" onClick={() => goToStep("species")}>
                    Editar em Espécie
                  </button>
                </>
              )}
            </p>
            <p>{view.summary}</p>
            {nonSkillChoices.map((choice) => (
              <FeatureChoiceControl key={choice.id} choice={choice} />
            ))}
            {hasSkillChoices && (
              <p className="builder-step__hint">
                Escolha(s) de perícia desta característica —{" "}
                <button type="button" className="review-edit-button" onClick={() => goToStep("skills")}>
                  Ver em Perícias
                </button>
              </p>
            )}
          </article>
        );
      })}

      {unlockedAsiLevels.length > 0 && (
        <label className="checkbox-field">
          <input type="checkbox" checked={showUnavailableFeats} onChange={(e) => setShowUnavailableFeats(e.target.checked)} />
          <span>Mostrar talentos indisponíveis</span>
        </label>
      )}

      {unlockedAsiLevels.map((level) => {
        const selection = character.asiSelections[level];
        const allocations = selection?.kind === "abilityIncrease" ? selection.allocations : null;
        return (
          <div key={level}>
            <AsiControl level={level} showUnavailableFeats={showUnavailableFeats} />
            {allocations && (
              <section className="feature-card" aria-label={`Distribuição de Atributo — nível ${level}`}>
                <h3>Aumento de Atributo (nível {level})</h3>
                <AbilityPointAllocator
                  config={ASI_ALLOCATION_CONFIG}
                  allocations={allocations}
                  baseScores={Object.fromEntries(
                    ASI_ALLOCATION_CONFIG.eligibleAbilities.map((ability) => [
                      ability,
                      getEffectiveAbilityScore(character, ability) - (allocations[ability] ?? 0),
                    ]),
                  ) as Record<AbilityKey, number>}
                  onIncrease={(ability) => increaseAsiAbility(level, ability)}
                  onDecrease={(ability) => decreaseAsiAbility(level, ability)}
                  tagOf={abilityRecommendations.tagOf}
                />
                <AbilityRecommendationsHint recommendations={abilityRecommendations} />
              </section>
            )}
          </div>
        );
      })}
    </div>
  );
}
