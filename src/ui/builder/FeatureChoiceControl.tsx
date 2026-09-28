import type { FeatureChoice } from "../../domain/features.js";
import { SKILL_KEYS } from "../../domain/ids.js";
import { skills } from "../../data/skills.js";
import { getWeaponsByCategory, weapons } from "../../rules/weapons.js";
import { useCharacterStore } from "../../state/characterStore.js";

export interface FeatureChoiceControlProps {
  choice: FeatureChoice;
}

/**
 * Controle genérico para uma escolha de feature (`FeatureChoice`),
 * baseado só em `effect.kind` — a mesma ideia da arquitetura aprovada
 * (§17): o Builder nunca tem uma lista fixa do que perguntar, ele lê o
 * tipo de efeito e desenha o controle certo. `manualText` é o fallback
 * aprovado para quando ainda não existe catálogo (ex.: magias) —
 * sempre marcado como entrada manual, nunca disfarçado de escolha
 * estruturada.
 */
export function FeatureChoiceControl({ choice }: FeatureChoiceControlProps) {
  const selection = useCharacterStore((s) => s.character.featureChoiceSelections[choice.id]);
  const setFeatureChoiceSelection = useCharacterStore((s) => s.setFeatureChoiceSelection);
  const { effect } = choice;

  if (effect.kind === "skillProficiency") {
    const options = effect.options === "any" ? SKILL_KEYS : effect.options;
    const selected = Array.isArray(selection?.value) ? selection.value : [];
    return (
      <fieldset className="feature-choice">
        <legend>
          {choice.prompt} ({selected.length}/{effect.count})
        </legend>
        {options.map((skillId) => (
          <label key={skillId} className="checkbox-field checkbox-field--compact">
            <input
              type="checkbox"
              checked={selected.includes(skillId)}
              disabled={!selected.includes(skillId) && selected.length >= effect.count}
              onChange={(e) => {
                const next = e.target.checked ? [...selected, skillId] : selected.filter((v) => v !== skillId);
                setFeatureChoiceSelection(choice.id, next);
              }}
            />
            <span>{skills[skillId].name}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (effect.kind === "weaponPicker") {
    const options = effect.category === "any" ? weapons : getWeaponsByCategory(effect.category);
    const value = typeof selection?.value === "string" ? selection.value : "";
    return (
      <label className="field feature-choice">
        <span>{choice.prompt}</span>
        <select value={value} onChange={(e) => setFeatureChoiceSelection(choice.id, e.target.value)}>
          <option value="">- Selecione -</option>
          {options.map((weapon) => (
            <option key={weapon.id} value={weapon.id}>
              {weapon.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (effect.kind === "toolProficiency") {
    const value = typeof selection?.value === "string" ? selection.value : "";
    return (
      <label className="field feature-choice">
        <span>{choice.prompt}</span>
        <p className="builder-step__hint">{effect.optionsText}</p>
        <input
          type="text"
          value={value}
          placeholder="Escreva sua escolha"
          onChange={(e) => setFeatureChoiceSelection(choice.id, e.target.value)}
        />
      </label>
    );
  }

  const value = typeof selection?.value === "string" ? selection.value : "";
  return (
    <label className="field feature-choice feature-choice--manual">
      <span>{choice.prompt} (entrada manual — sem catálogo ainda)</span>
      <textarea value={value} placeholder={effect.placeholder} onChange={(e) => setFeatureChoiceSelection(choice.id, e.target.value)} />
    </label>
  );
}
