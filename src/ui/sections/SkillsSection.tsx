import { useCharacterStore } from "../../state/characterStore.js";
import type { SkillKey } from "../../domain/ids.js";
import { skills } from "../../data/skills.js";
import {
  getSkillBonus,
  getSkillExpertise,
  getSkillProficiency,
  isSkillGrantedByBackground,
  isSkillGrantedByClassChoice,
  isSkillGrantedExpertiseByClassChoice,
} from "../../rules/skills.js";
import { ComputedField } from "../components/ComputedField.js";

export interface SkillRowProps {
  skillId: SkillKey;
}

/** Uma linha de perícia — usada dentro do card do atributo que a governa (ver AbilitiesSection). */
export function SkillRow({ skillId }: SkillRowProps) {
  const character = useCharacterStore((s) => s.character);
  const setSkillManualOverride = useCharacterStore((s) => s.setSkillManualOverride);
  const setSkillExpertise = useCharacterStore((s) => s.setSkillExpertise);
  const setSkillManualAdjustment = useCharacterStore((s) => s.setSkillManualAdjustment);

  const definition = skills[skillId];
  const proficient = getSkillProficiency(character, skillId);
  const grantedByBackground = isSkillGrantedByBackground(character, skillId);
  const grantedByClassChoice = isSkillGrantedByClassChoice(character, skillId);
  const grantedByOrigin = grantedByBackground || grantedByClassChoice;

  return (
    <li className="trait-row">
      <label
        className="trait-row__check"
        title={
          grantedByBackground && grantedByClassChoice
            ? "Concedida pelo antecedente e pela escolha de perícias de classe (ainda editável)"
            : grantedByBackground
              ? "Concedida pelo antecedente atual (ainda editável)"
              : grantedByClassChoice
                ? "Concedida pela escolha de perícias de classe (ainda editável)"
                : undefined
        }
      >
        <input type="checkbox" checked={proficient} onChange={(e) => setSkillManualOverride(skillId, e.target.checked)} />
        <span>
          {definition.name}
          {grantedByOrigin && (
            <span className="trait-row__origin-dot" aria-hidden="true">
              {" "}
              •
            </span>
          )}
        </span>
      </label>
      <label
        className="trait-row__expertise"
        title={
          isSkillGrantedExpertiseByClassChoice(character, skillId)
            ? "Especialização concedida por escolha de classe (ex.: Especialista do Bardo — ainda editável)"
            : "Especialização (dobra a proficiência)"
        }
      >
        <input
          type="checkbox"
          checked={getSkillExpertise(character, skillId)}
          disabled={!proficient}
          onChange={(e) => setSkillExpertise(skillId, e.target.checked)}
          aria-label={`Especialização em ${definition.name}`}
        />
        <span aria-hidden="true">E</span>
      </label>
      <ComputedField
        label={definition.name}
        computed={getSkillBonus(character, skillId)}
        onManualChange={(value) => setSkillManualAdjustment(skillId, value)}
      />
    </li>
  );
}
