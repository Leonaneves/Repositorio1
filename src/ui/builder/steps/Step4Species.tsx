import { useCharacterStore } from "../../../state/characterStore.js";
import type { AbilityKey } from "../../../domain/common.js";
import { SPECIES_IDS } from "../../../domain/ids.js";
import { species } from "../../../data/species.js";
import { getSpeciesLineageLabel, getSpeciesLineageOptions, hasSpeciesLineage } from "../../../data/speciesLineages.js";
import { getSpeciesTraitsPrintedText } from "../../../rules/speciesLineagePrintedFeatures.js";

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

/**
 * Etapa 4 — escolha de espécie, com subseção de Linhagem/Ancestralidade
 * imediatamente abaixo (fonte "IMPLEMENTAR LINHAGENS E ANCESTRALIDADES
 * NA ETAPA ESPÉCIE" §2): só aparece para Draconato/Elfo/Gnomo/Golias/
 * Tiefling, mostrando só a escolha correspondente à espécie ATUAL —
 * nunca um item próprio na navegação lateral (mesmo padrão de UI
 * própria fora do `FeatureChoice` genérico já usado em Metamagia/
 * Invocações/ASI). Elfo ganha ainda o atributo de conjuração da
 * Linhagem Élfica (INT/SAB/CAR), independente do atributo de
 * conjuração da classe.
 */
export function Step4Species() {
  const character = useCharacterStore((s) => s.character);
  const speciesId = character.speciesId;
  const setSpecies = useCharacterStore((s) => s.setSpecies);
  const setSpeciesLineage = useCharacterStore((s) => s.setSpeciesLineage);
  const setElvenLineageSpellcastingAbility = useCharacterStore((s) => s.setElvenLineageSpellcastingAbility);

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

          {speciesId === "elfo" && (
            <label className="field">
              <span>Atributo de Conjuração da Linhagem Élfica</span>
              <select
                value={character.elvenLineageSpellcastingAbility ?? ""}
                onChange={(e) => setElvenLineageSpellcastingAbility(e.target.value ? (e.target.value as AbilityKey) : null)}
              >
                <option value="">- Selecione -</option>
                <option value="INT">{ABILITY_NAMES.INT}</option>
                <option value="SAB">{ABILITY_NAMES.SAB}</option>
                <option value="CAR">{ABILITY_NAMES.CAR}</option>
              </select>
            </label>
          )}
        </fieldset>
      )}

      {speciesId && <pre className="builder-step__traits">{getSpeciesTraitsPrintedText(character)}</pre>}
    </div>
  );
}
