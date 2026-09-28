import { useCharacterStore } from "../../../state/characterStore.js";
import { ABILITY_KEYS, type AbilityKey } from "../../../domain/common.js";
import { skillsByAbility } from "../../../data/skills.js";
import { getClassToolProficiencyEntries, getClassWeaponProficiencyEntries, renderAutoTextBlock } from "../../../rules/proficiencyText.js";
import { SavingThrowRow } from "../../sections/SavingThrowsSection.js";
import { SkillRow } from "../../sections/SkillsSection.js";

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

/** Etapa 7 — perícias e proficiências: salvaguardas + perícias (reaproveita SkillRow/SavingThrowRow) + texto automático de armas/ferramentas da classe. */
export function Step7Skills() {
  const character = useCharacterStore((s) => s.character);
  const weaponText = renderAutoTextBlock(getClassWeaponProficiencyEntries(character), character.weaponProficienciesNotes);
  const toolText = renderAutoTextBlock(getClassToolProficiencyEntries(character), character.toolProficienciesNotes);

  return (
    <div className="builder-step" aria-label="Perícias e Proficiências">
      {ABILITY_KEYS.map((ability) => (
        <fieldset key={ability} className="skills-by-ability">
          <legend>{ABILITY_NAMES[ability]}</legend>
          <ul className="trait-list">
            <SavingThrowRow ability={ability} />
            {skillsByAbility[ability].map((skill) => (
              <SkillRow key={skill.id} skillId={skill.id} />
            ))}
          </ul>
        </fieldset>
      ))}

      {weaponText && (
        <p className="builder-step__hint">
          <strong>Armas:</strong> {weaponText}
        </p>
      )}
      {toolText && (
        <p className="builder-step__hint">
          <strong>Ferramentas:</strong> {toolText}
        </p>
      )}
    </div>
  );
}
