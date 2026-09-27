import { useCharacterStore } from "../../state/characterStore.js";
import { skillList } from "../../data/skills.js";
import { getSkillBonus } from "../../rules/skills.js";
import { ComputedField } from "../components/ComputedField.js";

export function SkillsSection() {
  const character = useCharacterStore((s) => s.character);
  const setSkillProficient = useCharacterStore((s) => s.setSkillProficient);
  const setSkillExpertise = useCharacterStore((s) => s.setSkillExpertise);
  const setSkillManualAdjustment = useCharacterStore((s) => s.setSkillManualAdjustment);

  return (
    <section className="sheet-section" aria-label="Perícias">
      <h2>Perícias</h2>
      <ul className="skill-list">
        {skillList.map((skill) => {
          const state = character.skills[skill.id];
          return (
            <li key={skill.id} className="skill-row">
              <label className="skill-row__proficient">
                <input
                  type="checkbox"
                  checked={state.proficient}
                  onChange={(e) => setSkillProficient(skill.id, e.target.checked)}
                />
                <span>
                  {skill.name} ({skill.ability})
                </span>
              </label>
              <label className="skill-row__expertise">
                <input
                  type="checkbox"
                  checked={state.expertise}
                  disabled={!state.proficient}
                  onChange={(e) => setSkillExpertise(skill.id, e.target.checked)}
                />
                <span>Especialização</span>
              </label>
              <ComputedField
                label=""
                computed={getSkillBonus(character, skill.id)}
                onManualChange={(value) => setSkillManualAdjustment(skill.id, value)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
