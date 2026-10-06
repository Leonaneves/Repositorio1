import { useCharacterStore } from "../../../state/characterStore.js";
import { SPECIES_IDS } from "../../../domain/ids.js";
import { species } from "../../../data/species.js";
import { getSpeciesLineageLabel, getSpeciesLineageOptions, hasSpeciesLineage } from "../../../data/speciesLineages.js";
import { getSpeciesTraitsPrintedText } from "../../../rules/speciesLineagePrintedFeatures.js";

/**
 * Etapa 4 — escolha de espécie, com subseção de Linhagem/Ancestralidade
 * imediatamente abaixo (fonte "IMPLEMENTAR LINHAGENS E ANCESTRALIDADES
 * NA ETAPA ESPÉCIE" §2): só aparece para Draconato/Elfo/Gnomo/Golias/
 * Tiefling, mostrando só a escolha correspondente à espécie ATUAL —
 * nunca um item próprio na navegação lateral (mesmo padrão de UI
 * própria fora do `FeatureChoice` genérico já usado em Metamagia/
 * Invocações/ASI). O atributo de conjuração das magias de Elfo/Gnomo/
 * Tiefling é sempre resolvido automaticamente por
 * `rules/speciesLineage.ts#getSpeciesLineageSpellcastingAbility` (classe
 * primeiro, senão o maior entre INT/SAB/CAR) — nunca uma escolha manual
 * nesta etapa.
 */
export function Step4Species() {
  const character = useCharacterStore((s) => s.character);
  const speciesId = character.speciesId;
  const setSpecies = useCharacterStore((s) => s.setSpecies);
  const setSpeciesLineage = useCharacterStore((s) => s.setSpeciesLineage);

  const lineageOptions = speciesId ? getSpeciesLineageOptions(speciesId) : [];
  const lineageLabel = speciesId ? getSpeciesLineageLabel(speciesId) : null;

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

      {speciesId && hasSpeciesLineage(speciesId) && (
        <fieldset className="species-lineage">
          <legend>{lineageLabel}</legend>
          <label className="field">
            <span>{lineageLabel}</span>
            <select value={character.speciesLineageId ?? ""} onChange={(e) => setSpeciesLineage(e.target.value || null)}>
              <option value="">- Selecione -</option>
              {lineageOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      )}

      {speciesId && <pre className="builder-step__traits">{getSpeciesTraitsPrintedText(character)}</pre>}
    </div>
  );
}
