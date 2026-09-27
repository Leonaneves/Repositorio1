import type { ChangeEvent } from "react";
import { useCharacterStore } from "../../state/characterStore.js";
import { CLASS_IDS, BACKGROUND_IDS, SPECIES_IDS } from "../../domain/ids.js";
import { classes } from "../../data/classes.js";
import { species } from "../../data/species.js";
import { backgrounds } from "../../data/backgrounds.js";
import { getAvailableSubclasses } from "../../rules/subclasses.js";
import type { ChoiceInsight } from "../../analytics/types.js";
import { findInsightItem } from "../../services/useInsights.js";
import { InsightPopover } from "../insights/InsightPopover.js";
import { InsightTooltip } from "../insights/InsightTooltip.js";

export interface IdentitySectionProps {
  subclassPopularity?: ChoiceInsight;
  speciesPopularity?: ChoiceInsight;
  backgroundPopularity?: ChoiceInsight;
}

export function IdentitySection({ subclassPopularity, speciesPopularity, backgroundPopularity }: IdentitySectionProps) {
  const character = useCharacterStore((s) => s.character);
  const setName = useCharacterStore((s) => s.setName);
  const setLevel = useCharacterStore((s) => s.setLevel);
  const setClass = useCharacterStore((s) => s.setClass);
  const setSubclass = useCharacterStore((s) => s.setSubclass);
  const setSpecies = useCharacterStore((s) => s.setSpecies);
  const setBackground = useCharacterStore((s) => s.setBackground);

  const availableSubclasses = character.classId ? getAvailableSubclasses(character.classId) : [];

  const speciesName = character.speciesId ? species[character.speciesId].name : undefined;
  const backgroundName = character.backgroundId ? backgrounds[character.backgroundId].name : undefined;

  return (
    <section className="sheet-section" aria-label="Identificação">
      <h2>Identificação</h2>

      <label className="field">
        <span>Nome do personagem</span>
        <input type="text" value={character.name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
      </label>

      <label className="field">
        <span>Nível</span>
        <input
          type="number"
          min={1}
          max={20}
          value={character.level}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value >= 1 && value <= 20) setLevel(value);
          }}
        />
      </label>

      <label className="field">
        <span>Classe</span>
        <select value={character.classId ?? ""} onChange={(e) => setClass(e.target.value ? (e.target.value as typeof CLASS_IDS[number]) : null)}>
          <option value="">- Selecione -</option>
          {CLASS_IDS.map((id) => (
            <option key={id} value={id}>
              {classes[id].name}
            </option>
          ))}
        </select>
      </label>

      {subclassPopularity && <InsightPopover insight={subclassPopularity} />}

      <label className="field">
        <span>Subclasse</span>
        <select
          value={character.subclassId ?? ""}
          disabled={!character.classId}
          onChange={(e) => setSubclass(e.target.value ? e.target.value : null)}
        >
          <option value="">{character.classId ? "Selecione..." : "Escolha uma classe primeiro"}</option>
          {availableSubclasses.map((s) => (
            <option key={s.fullName} value={s.fullName}>
              {s.shortName}
            </option>
          ))}
        </select>
      </label>

      {character.subclassId && (
        <InsightTooltip insight={subclassPopularity} chosenLabel={character.subclassId} phrase="escolhido por" />
      )}

      <label className="field">
        <span>Espécie</span>
        <select value={character.speciesId ?? ""} onChange={(e) => setSpecies(e.target.value ? (e.target.value as typeof SPECIES_IDS[number]) : null)}>
          <option value="">- Selecione -</option>
          {SPECIES_IDS.map((id) => (
            <option key={id} value={id}>
              {species[id].name}
            </option>
          ))}
        </select>
      </label>

      {speciesName && findInsightItem(speciesPopularity, speciesName) && (
        <InsightTooltip insight={speciesPopularity} chosenLabel={speciesName} phrase="escolhida por" />
      )}

      <label className="field">
        <span>Antecedente</span>
        <select
          value={character.backgroundId ?? ""}
          onChange={(e) => setBackground(e.target.value ? (e.target.value as typeof BACKGROUND_IDS[number]) : null)}
        >
          <option value="">- Selecione -</option>
          {BACKGROUND_IDS.map((id) => (
            <option key={id} value={id}>
              {backgrounds[id].name}
            </option>
          ))}
        </select>
      </label>

      {backgroundName && findInsightItem(backgroundPopularity, backgroundName) && (
        <InsightTooltip
          insight={backgroundPopularity}
          chosenLabel={backgroundName}
          phrase={character.classId ? `combinado com ${classes[character.classId].name} em` : "combinado em"}
        />
      )}
    </section>
  );
}
