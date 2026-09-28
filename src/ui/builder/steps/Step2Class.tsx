import { useCharacterStore } from "../../../state/characterStore.js";
import { CLASS_IDS } from "../../../domain/ids.js";
import { classes } from "../../../data/classes.js";

/** Etapa 2 — escolha de classe. */
export function Step2Class() {
  const classId = useCharacterStore((s) => s.character.classId);
  const setClass = useCharacterStore((s) => s.setClass);

  return (
    <div className="builder-step" aria-label="Classe">
      <label className="field">
        <span>Classe</span>
        <select value={classId ?? ""} onChange={(e) => setClass(e.target.value ? (e.target.value as (typeof CLASS_IDS)[number]) : null)}>
          <option value="">- Selecione -</option>
          {CLASS_IDS.map((id) => (
            <option key={id} value={id}>
              {classes[id].name}
            </option>
          ))}
        </select>
      </label>
      {classId && (
        <p className="builder-step__hint">
          Dado de Vida: d{classes[classId].hitDie} · {classes[classId].weaponProficiencyText}
        </p>
      )}
    </div>
  );
}
