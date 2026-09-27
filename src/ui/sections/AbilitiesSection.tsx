import { useCharacterStore } from "../../state/characterStore.js";
import type { AbilityKey } from "../../domain/common.js";
import { getAbilityModifier } from "../../rules/abilities.js";
import { skillsByAbility } from "../../data/skills.js";
import type { ChoiceInsight } from "../../analytics/types.js";
import { InsightCard } from "../insights/InsightCard.js";
import { SavingThrowRow } from "./SavingThrowsSection.js";
import { SkillRow } from "./SkillsSection.js";

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

// Ordem e agrupamento em duas colunas, como na ficha original:
// FOR/DEX/CON à esquerda, INT/SAB/CAR à direita.
const LEFT_COLUMN: readonly AbilityKey[] = ["FOR", "DEX", "CON"];
const RIGHT_COLUMN: readonly AbilityKey[] = ["INT", "SAB", "CAR"];

function formatSigned(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export interface AbilitiesSectionProps {
  abilityHighest?: ChoiceInsight;
}

export function AbilitiesSection({ abilityHighest }: AbilitiesSectionProps) {
  const abilities = useCharacterStore((s) => s.character.abilities);
  const setAbilityScore = useCharacterStore((s) => s.setAbilityScore);

  const renderColumn = (keys: readonly AbilityKey[]) => (
    <div className="ability-column">
      {keys.map((ability) => (
        <article className="ability-card" key={ability} aria-label={ABILITY_NAMES[ability]}>
          <h3 className="ability-card__name">{ABILITY_NAMES[ability]}</h3>
          <div className="ability-card__score">
            <label>
              <span className="ability-card__score-label">Valor</span>
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
            </label>
            <span className="ability-card__modifier" aria-label="Modificador">
              {formatSigned(getAbilityModifier(abilities[ability].score))}
            </span>
          </div>
          <ul className="trait-list">
            <SavingThrowRow ability={ability} />
            {skillsByAbility[ability].map((skill) => (
              <SkillRow key={skill.id} skillId={skill.id} />
            ))}
          </ul>
        </article>
      ))}
    </div>
  );

  return (
    <section className="sheet-section sheet-section--abilities" aria-label="Atributos, perícias e salvaguardas">
      <h2>Atributos</h2>
      {abilityHighest && <InsightCard insight={abilityHighest} />}
      <div className="ability-grid">
        {renderColumn(LEFT_COLUMN)}
        {renderColumn(RIGHT_COLUMN)}
      </div>
    </section>
  );
}
