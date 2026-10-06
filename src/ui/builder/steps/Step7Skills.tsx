import { useCharacterStore } from "../../../state/characterStore.js";
import { useBuilderUiStore } from "../../../state/builderUiStore.js";
import { ABILITY_KEYS, type AbilityKey } from "../../../domain/common.js";
import { skillsByAbility } from "../../../data/skills.js";
import { getClassToolProficiencyEntries, getClassWeaponProficiencyEntries, renderAutoTextBlock } from "../../../rules/proficiencyText.js";
import { SavingThrowRow } from "../../sections/SavingThrowsSection.js";
import { SkillRow } from "../../sections/SkillsSection.js";

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

/**
 * Etapa 7 — visão CONSOLIDADA de perícias e proficiências (fonte
 * "REORGANIZAÇÃO DO BUILDER" §31): mostra o resultado combinado de
 * todas as origens (Antecedente/Classe/Manual — reaproveita
 * SkillRow/SavingThrowRow, nunca duplica a lógica aqui) + texto
 * automático de armas/ferramentas da classe. Em modo normal, a
 * proficiência de cada perícia é protegida (só muda pelas fontes
 * estruturadas); o botão "Editar perícias" liga o modo Homebrew (§11).
 */
export function Step7Skills() {
  const character = useCharacterStore((s) => s.character);
  const homebrew = useBuilderUiStore((s) => s.skillsHomebrew);
  const toggleSkillsHomebrew = useBuilderUiStore((s) => s.toggleSkillsHomebrew);
  const weaponText = renderAutoTextBlock(getClassWeaponProficiencyEntries(character), character.weaponProficienciesNotes);
  const toolText = renderAutoTextBlock(getClassToolProficiencyEntries(character), character.toolProficienciesNotes);

  return (
    <div className="builder-step" aria-label="Perícias e Proficiências">
      <button type="button" className="homebrew-toggle" onClick={toggleSkillsHomebrew} aria-pressed={homebrew}>
        ✎ {homebrew ? "Desativar edição manual (Homebrew)" : "Editar perícias"}
      </button>
      {homebrew && <p className="builder-step__hint">Modo manual / Homebrew ativo — qualquer perícia pode ser marcada/desmarcada livremente.</p>}

      {ABILITY_KEYS.map((ability) => (
        <fieldset key={ability} className="skills-by-ability">
          <legend>{ABILITY_NAMES[ability]}</legend>
          <ul className="trait-list">
            <SavingThrowRow ability={ability} />
            {skillsByAbility[ability].map((skill) => (
              <SkillRow key={skill.id} skillId={skill.id} />
            ))}
          </ul>
        </fieldset>
      ))}

      {weaponText && (
        <p className="builder-step__hint">
          <strong>Armas:</strong> {weaponText}
        </p>
      )}
      {toolText && (
        <p className="builder-step__hint">
          <strong>Ferramentas:</strong> {toolText}
        </p>
      )}
    </div>
  );
}
