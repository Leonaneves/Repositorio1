import type { ChangeEvent } from "react";
import { useCharacterStore } from "../../state/characterStore.js";
import { CLASS_IDS, BACKGROUND_IDS, SPECIES_IDS } from "../../domain/ids.js";
import { classes } from "../../data/classes.js";
import { species } from "../../data/species.js";
import { backgrounds } from "../../data/backgrounds.js";
import { canChooseSubclass, getAvailableSubclasses } from "../../rules/subclasses.js";
import type { ChoiceInsight } from "../../analytics/types.js";
import { findInsightItem } from "../../services/useInsights.js";
import { InsightPopover } from "../insights/InsightPopover.js";
import { InsightTooltip } from "../insights/InsightTooltip.js";

export interface IdentitySectionProps {
  subclassPopularity?: ChoiceInsight;
  speciesPopularity?: ChoiceInsight;
  backgroundPopularity?: ChoiceInsight;
}

/**
 * Cabeçalho da ficha: nome, antecedente, classe, subclasse e nível —
 * o bloco superior-esquerdo da referência. O selo de CA e o "dado de
 * vida"/PV/salvaguarda contra morte da referência ficam fora desta
 * etapa (PV ainda não tem input funcional no domínio — ver relatório).
 */
export function IdentitySection({ subclassPopularity, speciesPopularity, backgroundPopularity }: IdentitySectionProps) {
  const character = useCharacterStore((s) => s.character);
  const setName = useCharacterStore((s) => s.setName);
  const setLevel = useCharacterStore((s) => s.setLevel);
  const setClass = useCharacterStore((s) => s.setClass);
  const setSubclass = useCharacterStore((s) => s.setSubclass);
  const setSpecies = useCharacterStore((s) => s.setSpecies);
  const setBackground = useCharacterStore((s) => s.setBackground);

  const subclassAvailable = character.classId !== null && canChooseSubclass(character.level);
  const availableSubclasses = character.classId ? getAvailableSubclasses(character.classId) : [];
  const speciesName = character.speciesId ? species[character.speciesId].name : undefined;
  const backgroundName = character.backgroundId ? backgrounds[character.backgroundId].name : undefined;

  return (
    <header className="sheet-header" aria-label="Identificação">
      <div className="sheet-header__identity">
        <label className="field field--name">
          <span>Nome do personagem</span>
          <input type="text" value={character.name} placeholder="—" onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
        </label>

        <div className="sheet-header__row">
          <label className="field">
            <span>Antecedente</span>
            <select value={character.backgroundId ?? ""} onChange={(e) => setBackground(e.target.value ? (e.target.value as (typeof BACKGROUND_IDS)[number]) : null)}>
              <option value="">- Selecione -</option>
              {BACKGROUND_IDS.map((id) => (
                <option key={id} value={id}>
                  {backgrounds[id].name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Classe</span>
            <select value={character.classId ?? ""} onChange={(e) => setClass(e.target.value ? (e.target.value as (typeof CLASS_IDS)[number]) : null)}>
              <option value="">- Selecione -</option>
              {CLASS_IDS.map((id) => (
                <option key={id} value={id}>
                  {classes[id].name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {subclassPopularity && <InsightPopover insight={subclassPopularity} />}

        <div className="sheet-header__row">
          <label className="field">
            <span>Espécie</span>
            <select value={character.speciesId ?? ""} onChange={(e) => setSpecies(e.target.value ? (e.target.value as (typeof SPECIES_IDS)[number]) : null)}>
              <option value="">- Selecione -</option>
              {SPECIES_IDS.map((id) => (
                <option key={id} value={id}>
                  {species[id].name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Subclasse</span>
            <select
              value={character.subclassId ?? ""}
              disabled={!subclassAvailable}
              onChange={(e) => setSubclass(e.target.value ? e.target.value : null)}
            >
              <option value="">
                {!character.classId ? "—" : subclassAvailable ? "Selecione..." : "Disponível a partir do nível 3"}
              </option>
              {availableSubclasses.map((s) => (
                <option key={s.fullName} value={s.fullName}>
                  {s.shortName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {character.subclassId && <InsightTooltip insight={subclassPopularity} chosenLabel={character.subclassId} />}
        {speciesName && findInsightItem(speciesPopularity, speciesName) && <InsightTooltip insight={speciesPopularity} chosenLabel={speciesName} />}
        {backgroundName && findInsightItem(backgroundPopularity, backgroundName) && (
          <InsightTooltip
            insight={backgroundPopularity}
            chosenLabel={backgroundName}
            scopePhrase={character.classId ? `dos ${classes[character.classId].name}s registrados` : undefined}
          />
        )}
      </div>

      <div className="sheet-header__level">
        <span className="sheet-header__level-label">Nível</span>
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
      </div>
    </header>
  );
}
