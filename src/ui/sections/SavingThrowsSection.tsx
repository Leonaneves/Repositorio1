import { useCharacterStore } from "../../state/characterStore.js";
import { ABILITY_KEYS } from "../../domain/common.js";
import { getSavingThrow } from "../../rules/savingThrows.js";
import { ComputedField } from "../components/ComputedField.js";

export function SavingThrowsSection() {
  const character = useCharacterStore((s) => s.character);
  const setSavingThrowProficient = useCharacterStore((s) => s.setSavingThrowProficient);
  const setSavingThrowManualAdjustment = useCharacterStore((s) => s.setSavingThrowManualAdjustment);

  return (
    <section className="sheet-section" aria-label="Salvaguardas">
      <h2>Salvaguardas</h2>
      <ul className="skill-list">
        {ABILITY_KEYS.map((ability) => {
          const state = character.savingThrows[ability];
          return (
            <li key={ability} className="skill-row">
              <label className="skill-row__proficient">
                <input
                  type="checkbox"
                  checked={state.proficient}
                  onChange={(e) => setSavingThrowProficient(ability, e.target.checked)}
                />
                <span>{ability}</span>
              </label>
              <ComputedField
                label=""
                computed={getSavingThrow(character, ability)}
                onManualChange={(value) => setSavingThrowManualAdjustment(ability, value)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
