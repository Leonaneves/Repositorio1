import type { FeatureChoice } from "../../domain/features.js";
import { SKILL_KEYS } from "../../domain/ids.js";
import { skills } from "../../data/skills.js";
import { tools } from "../../data/tools.js";
import { getWeaponsByCategory, weapons } from "../../rules/weapons.js";
import { getSkillProficiency } from "../../rules/skills.js";
import { getEligibleTools } from "../../rules/tools.js";
import { useCharacterStore } from "../../state/characterStore.js";

export interface FeatureChoiceControlProps {
  choice: FeatureChoice;
}

/**
 * Controle genérico para uma escolha de feature (`FeatureChoice`),
 * baseado só em `effect.kind` — a mesma ideia da arquitetura aprovada
 * (§17): o Builder nunca tem uma lista fixa do que perguntar, ele lê o
 * tipo de efeito e desenha o controle certo. `manualText` é o fallback
 * aprovado para quando ainda não existe catálogo (ex.: magias) —
 * sempre marcado como entrada manual, nunca disfarçado de escolha
 * estruturada.
 */
export function FeatureChoiceControl({ choice }: FeatureChoiceControlProps) {
  const character = useCharacterStore((s) => s.character);
  const selection = character.featureChoiceSelections[choice.id];
  const setFeatureChoiceSelection = useCharacterStore((s) => s.setFeatureChoiceSelection);
  const enableToolsHomebrew = useCharacterStore((s) => s.enableToolsHomebrew);
  const disableToolsHomebrew = useCharacterStore((s) => s.disableToolsHomebrew);
  const addManualTool = useCharacterStore((s) => s.addManualTool);
  const removeManualTool = useCharacterStore((s) => s.removeManualTool);
  const { effect } = choice;

  if (effect.kind === "skillProficiency") {
    const allOptions = effect.options === "any" ? SKILL_KEYS : effect.options;
    const selected = Array.isArray(selection?.value) ? selection.value : [];
    // Uma perícia já SELECIONADA nesta mesma escolha nunca some da lista, mesmo que
    // `excludeAlreadyProficient` esteja ligado — senão a própria seleção (que concede a
    // proficiência) faria a opção desaparecer assim que marcada (Conhecimento Primordial).
    const options = effect.excludeAlreadyProficient
      ? allOptions.filter((skillId) => selected.includes(skillId) || !getSkillProficiency(character, skillId))
      : allOptions;
    return (
      <fieldset className="feature-choice">
        <legend>
          {choice.prompt} ({selected.length}/{effect.count})
        </legend>
        {options.map((skillId) => (
          <label key={skillId} className="checkbox-field checkbox-field--compact">
            <input
              type="checkbox"
              checked={selected.includes(skillId)}
              disabled={!selected.includes(skillId) && selected.length >= effect.count}
              onChange={(e) => {
                const next = e.target.checked ? [...selected, skillId] : selected.filter((v) => v !== skillId);
                setFeatureChoiceSelection(choice.id, next);
              }}
            />
            <span>{skills[skillId].name}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (effect.kind === "skillExpertise") {
    const selected = Array.isArray(selection?.value) ? selection.value : [];
    // Só perícias já proficientes entram na lista (nunca concede a proficiência) — uma perícia já
    // SELECIONADA nesta mesma escolha nunca some, mesmo que algo externo mude sua proficiência depois.
    const options = SKILL_KEYS.filter((skillId) => selected.includes(skillId) || getSkillProficiency(character, skillId));
    return (
      <fieldset className="feature-choice">
        <legend>
          {choice.prompt} ({selected.length}/{effect.count})
        </legend>
        {options.map((skillId) => (
          <label key={skillId} className="checkbox-field checkbox-field--compact">
            <input
              type="checkbox"
              checked={selected.includes(skillId)}
              disabled={!selected.includes(skillId) && selected.length >= effect.count}
              onChange={(e) => {
                const next = e.target.checked ? [...selected, skillId] : selected.filter((v) => v !== skillId);
                setFeatureChoiceSelection(choice.id, next);
              }}
            />
            <span>{skills[skillId].name}</span>
          </label>
        ))}
        {options.length === 0 && <p className="builder-step__hint">Escolha proficiência em ao menos uma perícia antes de especializar-se.</p>}
      </fieldset>
    );
  }

  if (effect.kind === "weaponPicker") {
    const byCategory = effect.category === "any" ? weapons : getWeaponsByCategory(effect.category);
    const options = effect.rangeKind ? byCategory.filter((weapon) => weapon.rangeKind === effect.rangeKind) : byCategory;
    const value = typeof selection?.value === "string" ? selection.value : "";
    return (
      <label className="field feature-choice">
        <span>{choice.prompt}</span>
        <select value={value} onChange={(e) => setFeatureChoiceSelection(choice.id, e.target.value)}>
          <option value="">- Selecione -</option>
          {options.map((weapon) => (
            <option key={weapon.id} value={weapon.id}>
              {weapon.name}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (effect.kind === "optionPick") {
    const value = typeof selection?.value === "string" ? selection.value : "";
    return (
      <label className="field feature-choice">
        <span>{choice.prompt}</span>
        <select value={value} onChange={(e) => setFeatureChoiceSelection(choice.id, e.target.value)}>
          <option value="">- Selecione -</option>
          {effect.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (effect.kind === "toolProficiency") {
    // Modo Homebrew (§5): substitui por completo a escolha automática — todas as
    // ferramentas do catálogo ficam disponíveis, sem restrição de categoria/quantidade.
    // Nunca destrói a escolha automática: ela só volta a valer quando o Homebrew é desativado.
    if (character.manualToolOverrides !== null) {
      const selected = character.manualToolOverrides;
      return (
        <fieldset className="feature-choice feature-choice--homebrew">
          <legend>
            {choice.prompt} — Modo manual / Homebrew
            <button type="button" className="homebrew-toggle" onClick={disableToolsHomebrew} aria-label="Desativar edição manual de ferramentas">
              ✎ Editar ferramentas
            </button>
          </legend>
          {tools.map((tool) => (
            <label key={tool.id} className="checkbox-field checkbox-field--compact">
              <input
                type="checkbox"
                checked={selected.includes(tool.id)}
                onChange={(e) => (e.target.checked ? addManualTool(tool.id) : removeManualTool(tool.id))}
              />
              <span>{tool.name}</span>
            </label>
          ))}
        </fieldset>
      );
    }

    const options = getEligibleTools(effect.category);
    const selected = Array.isArray(selection?.value) ? selection.value : [];
    return (
      <fieldset className="feature-choice">
        <legend>
          {choice.prompt} ({selected.length}/{effect.count})
          <button type="button" className="homebrew-toggle" onClick={enableToolsHomebrew} aria-label="Editar ferramentas manualmente (Homebrew)">
            ✎ Editar ferramentas
          </button>
        </legend>
        {options.map((tool) => (
          <label key={tool.id} className="checkbox-field checkbox-field--compact">
            <input
              type="checkbox"
              checked={selected.includes(tool.id)}
              disabled={!selected.includes(tool.id) && selected.length >= effect.count}
              onChange={(e) => {
                const next = e.target.checked ? [...selected, tool.id] : selected.filter((v) => v !== tool.id);
                setFeatureChoiceSelection(choice.id, next);
              }}
            />
            <span>{tool.name}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  const value = typeof selection?.value === "string" ? selection.value : "";
  return (
    <label className="field feature-choice feature-choice--manual">
      <span>{choice.prompt} (entrada manual — sem catálogo ainda)</span>
      <textarea value={value} placeholder={effect.placeholder} onChange={(e) => setFeatureChoiceSelection(choice.id, e.target.value)} />
    </label>
  );
}
