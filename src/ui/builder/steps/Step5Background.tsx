import { useCharacterStore } from "../../../state/characterStore.js";
import { BACKGROUND_IDS } from "../../../domain/ids.js";
import { backgrounds } from "../../../data/backgrounds.js";
import { skills } from "../../../data/skills.js";

/** Etapa 5 — escolha de antecedente. */
export function Step5Background() {
  const backgroundId = useCharacterStore((s) => s.character.backgroundId);
  const setBackground = useCharacterStore((s) => s.setBackground);

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
    </div>
  );
}
