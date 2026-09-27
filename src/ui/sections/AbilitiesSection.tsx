import { useCharacterStore } from "../../state/characterStore.js";
import { ABILITY_KEYS } from "../../domain/common.js";
import { getAbilityModifier } from "../../rules/abilities.js";
import type { ChoiceInsight } from "../../analytics/types.js";
import { InsightCard } from "../insights/InsightCard.js";

const ABILITY_NAMES: Record<string, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

function formatSigned(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export interface AbilitiesSectionProps {
  abilityHighest?: ChoiceInsight;
}

export function AbilitiesSection({ abilityHighest }: AbilitiesSectionProps) {
  const abilities = useCharacterStore((s) => s.character.abilities);
  const setAbilityScore = useCharacterStore((s) => s.setAbilityScore);

  return (
    <section className="sheet-section" aria-label="Atributos">
      <h2>Atributos</h2>
      <div className="ability-grid">
        {ABILITY_KEYS.map((ability) => (
          <label className="ability-box" key={ability}>
            <span className="ability-box__name">{ABILITY_NAMES[ability]}</span>
            <input
              type="number"
              min={1}
              max={30}
              value={abilities[ability].score}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (value >= 1 && value <= 30) setAbilityScore(ability, value);
              }}
            />
            <span className="ability-box__modifier">{formatSigned(getAbilityModifier(abilities[ability].score))}</span>
          </label>
        ))}
      </div>
      {abilityHighest && <InsightCard insight={abilityHighest} />}
    </section>
  );
}
