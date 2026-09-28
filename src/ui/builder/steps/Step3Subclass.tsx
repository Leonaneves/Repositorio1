import { useCharacterStore } from "../../../state/characterStore.js";
import { getAvailableSubclasses } from "../../../rules/subclasses.js";

/** Etapa 3 — subclasse (só é exibida a partir do nível 3, ver BuilderWizard/isStepVisible). */
export function Step3Subclass() {
  const character = useCharacterStore((s) => s.character);
  const setSubclass = useCharacterStore((s) => s.setSubclass);

  if (!character.classId) {
    return (
      <div className="builder-step" aria-label="Subclasse">
        <p className="empty-note">Escolha uma classe na etapa anterior antes de escolher a subclasse.</p>
      </div>
    );
  }

  const available = getAvailableSubclasses(character.classId);

  return (
    <div className="builder-step" aria-label="Subclasse">
      <label className="field">
        <span>Subclasse</span>
        <select value={character.subclassId ?? ""} onChange={(e) => setSubclass(e.target.value ? e.target.value : null)}>
          <option value="">- Selecione -</option>
          {available.map((s) => (
            <option key={s.fullName} value={s.fullName}>
              {s.shortName}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
