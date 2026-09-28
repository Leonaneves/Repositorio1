import { useCharacterStore } from "../../../state/characterStore.js";
import { useBuilderStore } from "../../../state/builderStore.js";
import { classes } from "../../../data/classes.js";
import { species } from "../../../data/species.js";
import { backgrounds } from "../../../data/backgrounds.js";
import { getAbilityModifier } from "../../../rules/abilities.js";
import { getArmorClass } from "../../../rules/armor.js";
import { getMaxHitPoints } from "../../../rules/hp.js";
import { getCharacterFeatures, getFeatureView } from "../../../rules/features.js";
import { ABILITY_KEYS, type AbilityKey } from "../../../domain/common.js";
import type { BuilderStepId } from "../../../rules/builderSteps.js";

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

function formatSigned(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

/** Etapa 11 — resumo compacto de tudo, com "Editar" voltando à etapa relevante (mesmo useCharacterStore, sem recomeçar do zero). */
export function Step11Review() {
  const character = useCharacterStore((s) => s.character);
  const goToStep = useBuilderStore((s) => s.goToStep);

  const ac = getArmorClass(character);
  const hp = getMaxHitPoints(character);
  const features = getCharacterFeatures(character);

  const editButton = (label: string, stepId: BuilderStepId) => (
    <button type="button" className="review-edit-button" onClick={() => goToStep(stepId)} aria-label={`Editar ${label}`}>
      Editar
    </button>
  );

  return (
    <div className="builder-step builder-step--review" aria-label="Revisão">
      <section className="review-block">
        <h3>Identidade {editButton("identidade", "basicInfo")}</h3>
        <p>
          {character.name || "(sem nome)"} — Nível {character.level}
          <br />
          {character.classId ? classes[character.classId].name : "(sem classe)"}
          {character.subclassId ? ` (${character.subclassId})` : ""}
          <br />
          {character.speciesId ? species[character.speciesId].name : "(sem espécie)"} ·{" "}
          {character.backgroundId ? backgrounds[character.backgroundId].name : "(sem antecedente)"}
        </p>
      </section>

      <section className="review-block">
        <h3>Atributos {editButton("atributos", "abilities")}</h3>
        <ul className="review-ability-list">
          {ABILITY_KEYS.map((ability) => (
            <li key={ability}>
              {ABILITY_NAMES[ability]}: {character.abilities[ability].score} ({formatSigned(getAbilityModifier(character.abilities[ability].score))})
            </li>
          ))}
        </ul>
      </section>

      <section className="review-block">
        <h3>Combate {editButton("equipamento", "equipment")}</h3>
        <p>
          CA {ac.total} · PV máximo {hp.total}
        </p>
      </section>

      <section className="review-block">
        <h3>Features</h3>
        {features.length === 0 && <p className="empty-note">Nenhuma feature ainda.</p>}
        <ul className="review-feature-list">
          {features.map((feature) => {
            const view = getFeatureView(feature);
            return (
              <li key={feature.id}>
                <strong>{view.name}</strong> ({view.originLabel})
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
