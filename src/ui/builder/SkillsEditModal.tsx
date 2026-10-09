import { useEffect, useRef } from "react";
import { useCharacterStore } from "../../state/characterStore.js";
import { useBuilderUiStore } from "../../state/builderUiStore.js";
import { ABILITY_KEYS, type AbilityKey } from "../../domain/common.js";
import type { SkillState } from "../../domain/character.js";
import type { SkillKey } from "../../domain/ids.js";
import { skillsByAbility, skills } from "../../data/skills.js";
import { backgrounds } from "../../data/backgrounds.js";
import { getCharacterFeatures, getFeatureView } from "../../rules/features.js";
import { getRedundantSkillChoiceSelections } from "../../rules/skillChoiceConflicts.js";
import { SkillRow } from "../sections/SkillsSection.js";
import { FeatureChoiceControl } from "./FeatureChoiceControl.js";

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

export interface SkillsEditModalProps {
  onClose: () => void;
}

/**
 * Tela de edição de Perícias e Proficiências — acessível SOMENTE pelo
 * botão "Editar" da Revisão (fonte "AJUSTES NO PDF, FORMA SELVAGEM E
 * EDIÇÃO DE PERÍCIAS" §3): nunca aparece como etapa lateral do Builder.
 * Reaproveita SkillRow/FeatureChoiceControl sem alterá-los — esta tela
 * só decide ONDE e QUANDO eles aparecem, nunca duplica a lógica de
 * proficiência/origem (toda ela já vive em `rules/skills.ts`).
 *
 * Cancelar restaura o snapshot de `character.skills` tirado na abertura
 * (as demais origens — escolhas de Classe/Espécie, Antecedente — nunca
 * são tocadas por este snapshot porque são sempre derivadas, nunca
 * armazenadas aqui). Salvar e Cancelar sempre desligam o modo Homebrew
 * local ao fechar — o Homebrew só existe enquanto esta tela está aberta.
 */
export function SkillsEditModal({ onClose }: SkillsEditModalProps) {
  const character = useCharacterStore((s) => s.character);
  const restoreSkills = useCharacterStore((s) => s.restoreSkills);
  const homebrew = useBuilderUiStore((s) => s.skillsHomebrew);
  const toggleSkillsHomebrew = useBuilderUiStore((s) => s.toggleSkillsHomebrew);
  const setSkillsHomebrew = useBuilderUiStore((s) => s.setSkillsHomebrew);

  const snapshotRef = useRef<Record<SkillKey, SkillState> | null>(null);
  if (snapshotRef.current === null) {
    snapshotRef.current = character.skills;
  }

  // O modo Homebrew é exclusivo desta tela — sempre começa desligado ao abrir,
  // mesmo que o botão "Editar perícias" da Ficha (fora do Builder) o tenha deixado ligado.
  useEffect(() => {
    setSkillsHomebrew(false);
  }, [setSkillsHomebrew]);

  const background = character.backgroundId ? backgrounds[character.backgroundId] : null;

  const skillChoiceFeatures = getCharacterFeatures(character)
    .map((feature) => ({
      feature,
      choices: (feature.choices ?? []).filter((choice) => choice.effect.kind === "skillProficiency" || choice.effect.kind === "skillExpertise"),
    }))
    .filter((entry) => entry.choices.length > 0);

  const redundant = getRedundantSkillChoiceSelections(character);

  function handleCancel() {
    if (snapshotRef.current) restoreSkills(snapshotRef.current);
    setSkillsHomebrew(false);
    onClose();
  }

  function handleSave() {
    setSkillsHomebrew(false);
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div className="modal skills-edit-modal" role="dialog" aria-modal="true" aria-label="Editar Perícias e Proficiências">
        <h2>Editar Perícias e Proficiências</h2>

        {redundant.length > 0 && (
          <section className="review-block review-block--pending" aria-label="Escolhas redundantes">
            <h3>Escolhas redundantes</h3>
            <ul className="review-pending-list">
              {redundant.map((entry) => (
                <li key={`${entry.choiceId}-${entry.skill}`}>
                  <strong>{skills[entry.skill].name}</strong> foi escolhida em "{entry.featureName}", mas essa perícia já é concedida por outra
                  origem. Ajuste a seleção em "{entry.featureName}" manualmente — nada é substituído automaticamente.
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="review-block">
          <h3>Origens automáticas</h3>
          {background && (
            <div className="review-subsection">
              <h4>Antecedente — {background.name}</h4>
              <ul className="review-inline-list">
                {background.grantedSkills.map((skillId) => (
                  <li key={skillId}>{skills[skillId].name}</li>
                ))}
              </ul>
            </div>
          )}
          {skillChoiceFeatures.map(({ feature, choices }) => {
            const view = getFeatureView(feature);
            return (
              <div key={feature.id} className="review-subsection">
                <h4>
                  {view.originLabel} — {view.name}
                </h4>
                {choices.map((choice) => (
                  <FeatureChoiceControl key={choice.id} choice={choice} />
                ))}
              </div>
            );
          })}
          {!background && skillChoiceFeatures.length === 0 && <p className="empty-note">Nenhuma origem automática de perícia registrada ainda.</p>}
        </section>

        <section className="review-block">
          <h3>Todas as perícias</h3>
          <button type="button" className="homebrew-toggle" onClick={toggleSkillsHomebrew} aria-pressed={homebrew}>
            ✎ {homebrew ? "Desativar edição manual (Homebrew)" : "Editar perícias manualmente (Homebrew)"}
          </button>
          {homebrew && (
            <p className="builder-step__hint">Modo manual / Homebrew ativo — qualquer perícia pode ser marcada/desmarcada livremente.</p>
          )}

          {ABILITY_KEYS.map((ability) => (
            <fieldset key={ability} className="skills-by-ability">
              <legend>{ABILITY_NAMES[ability]}</legend>
              <ul className="trait-list">
                {skillsByAbility[ability].map((skill) => (
                  <SkillRow key={skill.id} skillId={skill.id} />
                ))}
              </ul>
            </fieldset>
          ))}
        </section>

        <div className="skills-edit-modal__actions">
          <button type="button" onClick={handleCancel}>
            Cancelar
          </button>
          <button type="button" onClick={handleSave}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
