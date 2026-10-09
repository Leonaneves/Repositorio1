import { useCharacterStore } from "../../state/characterStore.js";
import { useBuilderUiStore } from "../../state/builderUiStore.js";
import type { SkillKey } from "../../domain/ids.js";
import { skills } from "../../data/skills.js";
import {
  getSkillBonus,
  getSkillExpertise,
  getSkillProficiency,
  getSkillProficiencyOrigin,
  isSkillGrantedExpertiseByClassChoice,
} from "../../rules/skills.js";
import { ComputedField } from "../components/ComputedField.js";

export interface SkillRowProps {
  skillId: SkillKey;
}

const ORIGIN_LABELS = { background: "Antecedente", class: "Classe", species: "Espécie", manual: "Manual" } as const;

/**
 * Uma linha de perícia — usada dentro do card do atributo que a
 * governa (ver AbilitiesSection) e na tela de edição de Perícias
 * aberta pela Revisão (`ui/builder/SkillsEditModal.tsx` — nunca uma
 * etapa lateral do Builder, fonte "AJUSTES NO PDF, FORMA SELVAGEM E
 * EDIÇÃO DE PERÍCIAS" §3). A UI diferencia (§6/§10): automática (Antecedente/Classe,
 * protegida em modo normal), manual (Homebrew) e disponível/sem
 * origem (-). Fora do modo Homebrew, a caixa de proficiência fica
 * desabilitada — a única forma de concedê-la é pela fonte estruturada
 * (Antecedente automático, ou a escolha de Perícias de Classe na
 * etapa Classe) — mesmo padrão de "regras de elegibilidade ativas,
 * proficiências automáticas protegidas" (§11).
 */
export function SkillRow({ skillId }: SkillRowProps) {
  const character = useCharacterStore((s) => s.character);
  const setSkillManualOverride = useCharacterStore((s) => s.setSkillManualOverride);
  const setSkillExpertise = useCharacterStore((s) => s.setSkillExpertise);
  const setSkillManualAdjustment = useCharacterStore((s) => s.setSkillManualAdjustment);
  const homebrew = useBuilderUiStore((s) => s.skillsHomebrew);

  const definition = skills[skillId];
  const proficient = getSkillProficiency(character, skillId);
  const origin = getSkillProficiencyOrigin(character, skillId);

  return (
    <li className="trait-row">
      <label
        className="trait-row__check"
        title={
          !homebrew && (origin === "background" || origin === "class" || origin === "species")
            ? "Proficiência automática — ative o modo Homebrew para editar manualmente"
            : undefined
        }
      >
        <input
          type="checkbox"
          checked={proficient}
          disabled={!homebrew}
          onChange={(e) => setSkillManualOverride(skillId, e.target.checked)}
        />
        <span>
          {definition.name}
          {origin && <span className="trait-row__origin-label"> {ORIGIN_LABELS[origin]}</span>}
        </span>
      </label>
      <label
        className="trait-row__expertise"
        title={
          isSkillGrantedExpertiseByClassChoice(character, skillId)
            ? "Especialização concedida por escolha de classe (ex.: Especialista do Bardo — ainda editável)"
            : "Especialização (dobra a proficiência)"
        }
      >
        <input
          type="checkbox"
          checked={getSkillExpertise(character, skillId)}
          disabled={!proficient}
          onChange={(e) => setSkillExpertise(skillId, e.target.checked)}
          aria-label={`Especialização em ${definition.name}`}
        />
        <span aria-hidden="true">E</span>
      </label>
      <ComputedField
        label={definition.name}
        computed={getSkillBonus(character, skillId)}
        onManualChange={(value) => setSkillManualAdjustment(skillId, value)}
      />
    </li>
  );
}
