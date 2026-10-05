import { useState, type ReactNode } from "react";
import { useCharacterStore } from "../../../state/characterStore.js";
import { useBuilderStore } from "../../../state/builderStore.js";
import { classes } from "../../../data/classes.js";
import { species } from "../../../data/species.js";
import { backgrounds } from "../../../data/backgrounds.js";
import { armors } from "../../../data/armors.js";
import { skills } from "../../../data/skills.js";
import { warlockInvocationsById } from "../../../data/invocations.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID, ELEMENTAL_AFFINITY_CHOICE_ID } from "../../../data/features/subclasses.js";
import { SKILL_KEYS } from "../../../domain/ids.js";
import { getAbilityModifier, getEffectiveAbilityScore, getProficiencyBonus } from "../../../rules/abilities.js";
import { getArmorClass } from "../../../rules/armor.js";
import { getMaxHitPoints, getMaxHitDice } from "../../../rules/hp.js";
import { getInitiative, getPassivePerception } from "../../../rules/derived.js";
import { getSpeed } from "../../../rules/speed.js";
import { getSize } from "../../../rules/size.js";
import { getSavingThrow } from "../../../rules/savingThrows.js";
import { getSkillProficiency, getSkillBonus } from "../../../rules/skills.js";
import { getSpellcastingAbility, getSpellAttackBonus, getSpellSaveDC } from "../../../rules/spellcasting.js";
import { getClassProgression } from "../../../rules/classProgression.js";
import { getCharacterFeatures, getFeatureView } from "../../../rules/features.js";
import { getPendingBuilderSteps } from "../../../rules/builderProgress.js";
import { isStepVisible } from "../../../rules/builderSteps.js";
import { getKnownMetamagicOptions } from "../../../rules/metamagic.js";
import { ABILITY_KEYS, type AbilityKey } from "../../../domain/common.js";
import type { BuilderStepId } from "../../../rules/builderSteps.js";
import type { Character } from "../../../domain/character.js";

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

function downloadPdfFile(character: Character, bytes: Uint8Array) {
  const safeName = character.name.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "") || "personagem";
  const blob = new Blob([bytes.slice().buffer], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ficha-${safeName}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

interface ClassChoiceRow {
  key: string;
  label: string;
  stepId: BuilderStepId;
  content: ReactNode;
}

/** Linhas de "Escolhas de Classe" (sistemas próprios de cada classe — nunca genéricas) — só entram quando a etapa correspondente é visível (reaproveita `isStepVisible`, nunca reimplementa a condição). */
function getClassChoiceRows(character: Character): ClassChoiceRow[] {
  const rows: ClassChoiceRow[] = [];

  if (isStepVisible("invocations", character)) {
    rows.push({
      key: "invocations",
      label: "Invocações Místicas",
      stepId: "invocations",
      content:
        character.chosenInvocations.length === 0 ? (
          <p className="empty-note">Nenhuma invocação escolhida ainda.</p>
        ) : (
          <ul className="review-inline-list">
            {character.chosenInvocations.map((chosen, i) => {
              const definition = warlockInvocationsById[chosen.invocationId];
              return (
                <li key={`${chosen.invocationId}-${i}`}>
                  {definition?.name ?? chosen.invocationId}
                  {chosen.subChoice ? ` — ${chosen.subChoice}` : ""}
                </li>
              );
            })}
          </ul>
        ),
    });
  }

  if (isStepVisible("metamagic", character)) {
    const known = getKnownMetamagicOptions(character);
    rows.push({
      key: "metamagic",
      label: "Metamagia",
      stepId: "metamagic",
      content:
        known.length === 0 ? (
          <p className="empty-note">Nenhuma opção de Metamagia escolhida ainda.</p>
        ) : (
          <ul className="review-inline-list">
            {known.map((option) => (
              <li key={option.id}>{option.name}</li>
            ))}
          </ul>
        ),
    });
  }

  if (isStepVisible("wildShapeForms", character)) {
    rows.push({
      key: "wildShapeForms",
      label: "Formas Conhecidas",
      stepId: "wildShapeForms",
      content:
        character.knownWildShapeForms.filter((f) => f.name.trim()).length === 0 ? (
          <p className="empty-note">Nenhuma Forma Conhecida escolhida ainda.</p>
        ) : (
          <ul className="review-inline-list">
            {character.knownWildShapeForms
              .filter((f) => f.name.trim())
              .map((form, i) => (
                <li key={i}>
                  {form.name} (ND {form.challengeRating || "—"}{form.hasFlySpeed ? ", Voo" : ""})
                </li>
              ))}
          </ul>
        ),
    });
  }

  return rows;
}

/** Linhas de "Escolhas de Subclasse" — escolhas duradouras guardadas fora do `FeatureChoice` genérico (`featureChoiceSelections` direto), com etapa própria do Builder. */
function getSubclassChoiceRows(character: Character): ClassChoiceRow[] {
  const rows: ClassChoiceRow[] = [];

  if (isStepVisible("earthCircleTerrain", character)) {
    const selection = character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID]?.value;
    rows.push({
      key: "earthCircleTerrain",
      label: "Terreno do Círculo da Terra",
      stepId: "earthCircleTerrain",
      content: typeof selection === "string" && selection ? <p>{selection}</p> : <p className="empty-note">Nenhum terreno escolhido ainda.</p>,
    });
  }

  if (isStepVisible("elementalAffinity", character)) {
    const selection = character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID]?.value;
    rows.push({
      key: "elementalAffinity",
      label: "Afinidade Elemental",
      stepId: "elementalAffinity",
      content: typeof selection === "string" && selection ? <p>{selection}</p> : <p className="empty-note">Nenhum tipo escolhido ainda.</p>,
    });
  }

  return rows;
}

/** Etapa 11 — resumo compacto de tudo, com "Editar" voltando à etapa relevante (mesmo useCharacterStore, sem recomeçar do zero). */
export function Step11Review() {
  const character = useCharacterStore((s) => s.character);
  const goToStep = useBuilderStore((s) => s.goToStep);
  const [exportState, setExportState] = useState<"idle" | "exporting" | "error">("idle");

  const ac = getArmorClass(character);
  const hp = getMaxHitPoints(character);
  const features = getCharacterFeatures(character);
  const spellcastingAbility = getSpellcastingAbility(character);
  const progression = getClassProgression(character);
  const armorName = character.armor.equipped === "unarmed" ? "Sem Armadura" : armors[character.armor.equipped].name;
  const pendingSteps = getPendingBuilderSteps(character);
  const classChoiceRows = getClassChoiceRows(character);
  const subclassChoiceRows = getSubclassChoiceRows(character);

  const editButton = (label: string, stepId: BuilderStepId) => (
    <button type="button" className="review-edit-button" onClick={() => goToStep(stepId)} aria-label={`Editar ${label}`}>
      Editar
    </button>
  );

  async function handleExport() {
    setExportState("exporting");
    try {
      // Import dinâmico: pdf-lib e o molde de ~2,3MB só carregam quando o jogador realmente exporta.
      const { exportCharacterToPdf } = await import("../../../pdf/exporter.js");
      const bytes = await exportCharacterToPdf(character);
      downloadPdfFile(character, bytes);
      setExportState("idle");
    } catch {
      setExportState("error");
    }
  }

  return (
    <div className="builder-step builder-step--review" aria-label="Revisão">
      {pendingSteps.length > 0 && (
        <section className="review-block review-block--pending" aria-label="Escolhas pendentes">
          <h3>Escolhas pendentes ({pendingSteps.length})</h3>
          <ul className="review-pending-list">
            {pendingSteps.map((pending) => (
              <li key={pending.stepId}>
                <div>
                  <strong>{pending.label}:</strong> {pending.blockers.join(" ")}
                </div>
                <button type="button" onClick={() => goToStep(pending.stepId)}>
                  Resolver
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="review-block">
        <button type="button" onClick={handleExport} disabled={exportState === "exporting" || pendingSteps.length > 0}>
          {exportState === "exporting" ? "Gerando PDF…" : "Exportar PDF"}
        </button>
        {exportState === "error" && <p className="empty-note">Não foi possível gerar o PDF. Tente novamente.</p>}
        {pendingSteps.length > 0 && <p className="empty-note">Resolva as escolhas pendentes acima antes de exportar o PDF.</p>}
      </section>

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
              {ABILITY_NAMES[ability]}: {getEffectiveAbilityScore(character, ability)} ({formatSigned(getAbilityModifier(getEffectiveAbilityScore(character, ability)))})
            </li>
          ))}
        </ul>
      </section>

      <section className="review-block">
        <h3>Combate {editButton("equipamento", "equipment")}</h3>
        <ul className="review-inline-list">
          <li>PV {hp.total}</li>
          <li>CA {ac.total}</li>
          <li>Iniciativa {formatSigned(getInitiative(character).total)}</li>
          <li>Proficiência {formatSigned(getProficiencyBonus(character.level))}</li>
          <li>Percepção Passiva {getPassivePerception(character).total}</li>
          <li>Deslocamento {getSpeed(character).total}m</li>
          <li>Tamanho {getSize(character).total ?? "—"}</li>
          <li>Dado de Vida {character.classId ? `d${classes[character.classId].hitDie}` : "—"} ({getMaxHitDice(character)})</li>
          <li>
            {armorName}
            {character.armor.shield ? " + Escudo" : ""}
          </li>
        </ul>
      </section>

      <section className="review-block">
        <h3>Salvaguardas</h3>
        <ul className="review-inline-list">
          {ABILITY_KEYS.map((ability) => (
            <li key={ability}>
              {character.savingThrows[ability].proficient ? "● " : "○ "}
              {ABILITY_NAMES[ability]} {formatSigned(getSavingThrow(character, ability).total)}
            </li>
          ))}
        </ul>
      </section>

      <section className="review-block">
        <h3>Perícias {editButton("perícias", "skills")}</h3>
        <ul className="review-inline-list">
          {SKILL_KEYS.map((skillId) => (
            <li key={skillId}>
              {getSkillProficiency(character, skillId) ? "● " : "○ "}
              {skills[skillId].name} {formatSigned(getSkillBonus(character, skillId).total)}
            </li>
          ))}
        </ul>
      </section>

      <section className="review-block">
        <h3>Equipamento {editButton("equipamento", "equipment")}</h3>
        {character.inventory.equipment.trim() ? (
          <p style={{ whiteSpace: "pre-line" }}>{character.inventory.equipment}</p>
        ) : (
          <p className="empty-note">Nenhum equipamento escolhido ainda.</p>
        )}
      </section>

      {classChoiceRows.length > 0 && (
        <section className="review-block">
          <h3>Escolhas de Classe</h3>
          {classChoiceRows.map((row) => (
            <div key={row.key} className="review-subsection">
              <h4>
                {row.label} {editButton(row.label, row.stepId)}
              </h4>
              {row.content}
            </div>
          ))}
        </section>
      )}

      {subclassChoiceRows.length > 0 && (
        <section className="review-block">
          <h3>Escolhas de Subclasse</h3>
          {subclassChoiceRows.map((row) => (
            <div key={row.key} className="review-subsection">
              <h4>
                {row.label} {editButton(row.label, row.stepId)}
              </h4>
              {row.content}
            </div>
          ))}
        </section>
      )}

      <section className="review-block">
        <h3>Características</h3>
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

      {spellcastingAbility && (
        <section className="review-block">
          <h3>Conjuração {editButton("conjuração", "spellcasting")}</h3>
          <ul className="review-inline-list">
            <li>Atributo {ABILITY_NAMES[spellcastingAbility]}</li>
            <li>CD {getSpellSaveDC(character)?.total ?? "—"}</li>
            <li>Ataque {formatSigned(getSpellAttackBonus(character)?.total ?? 0)}</li>
            {progression.cantripsKnown !== null && <li>Truques conhecidos {progression.cantripsKnown}</li>}
            {progression.spellsPreparedMax !== null && <li>Magias preparadas {progression.spellsPreparedMax}</li>}
          </ul>
          <p className="review-spell-slots">
            Espaços de magia:{" "}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9]
              .map((circle) => progression.spellSlots[circle as 1])
              .map((count, i) => (count > 0 ? `${i + 1}º: ${count}` : null))
              .filter(Boolean)
              .join(" · ") || "nenhum neste nível"}
          </p>
        </section>
      )}
    </div>
  );
}
