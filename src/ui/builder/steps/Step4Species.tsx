import { useCharacterStore } from "../../../state/characterStore.js";
import { SPECIES_IDS } from "../../../domain/ids.js";
import { species } from "../../../data/species.js";

/** Etapa 4 — escolha de espécie. */
export function Step4Species() {
  const speciesId = useCharacterStore((s) => s.character.speciesId);
  const setSpecies = useCharacterStore((s) => s.setSpecies);

  return (
    <div className="builder-step" aria-label="Espécie">
      <label className="field">
        <span>Espécie</span>
        <select value={speciesId ?? ""} onChange={(e) => setSpecies(e.target.value ? (e.target.value as (typeof SPECIES_IDS)[number]) : null)}>
          <option value="">- Selecione -</option>
          {SPECIES_IDS.map((id) => (
            <option key={id} value={id}>
              {species[id].name}
            </option>
          ))}
        </select>
      </label>
      {speciesId && <pre className="builder-step__traits">{species[speciesId].traitsText}</pre>}
    </div>
  );
}
