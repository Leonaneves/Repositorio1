import { useCharacterStore } from "../../../state/characterStore.js";
import { BACKGROUND_IDS } from "../../../domain/ids.js";
import { ABILITY_KEYS, type AbilityKey } from "../../../domain/common.js";
import { backgrounds, getBackgroundAbilityAllocationConfig } from "../../../data/backgrounds.js";
import { skills } from "../../../data/skills.js";
import { getEffectiveAbilityScore } from "../../../rules/abilities.js";
import { AbilityPointAllocator } from "../../components/AbilityPointAllocator.js";

/** Etapa 5 — escolha de antecedente, com os Aumentos de Atributo do próprio Antecedente (componente genérico de distribuição — §19). */
export function Step5Background() {
  const character = useCharacterStore((s) => s.character);
  const backgroundId = character.backgroundId;
  const setBackground = useCharacterStore((s) => s.setBackground);
  const increaseBackgroundAbilityBonus = useCharacterStore((s) => s.increaseBackgroundAbilityBonus);
  const decreaseBackgroundAbilityBonus = useCharacterStore((s) => s.decreaseBackgroundAbilityBonus);

  const config = backgroundId ? getBackgroundAbilityAllocationConfig(backgroundId) : null;
  const baseScores = Object.fromEntries(
    ABILITY_KEYS.map((ability) => [ability, getEffectiveAbilityScore(character, ability) - (character.backgroundAbilityBonuses[ability] ?? 0)]),
  ) as Record<AbilityKey, number>;

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
              {backgrounds[id].name}
            </option>
          ))}
        </select>
      </label>
      {backgroundId && (
        <p className="builder-step__hint">
          Perícias: {backgrounds[backgroundId].grantedSkills.map((skillId) => skills[skillId].name).join(", ")}
          <br />
          Talento de Origem: {backgrounds[backgroundId].originFeat}
        </p>
      )}

      {config && (
        <fieldset className="feature-choice">
          <legend>Aumentos de Atributo</legend>
          <AbilityPointAllocator
            config={config}
            allocations={character.backgroundAbilityBonuses}
            baseScores={baseScores}
            onIncrease={increaseBackgroundAbilityBonus}
            onDecrease={decreaseBackgroundAbilityBonus}
          />
        </fieldset>
      )}
    </div>
  );
}
