import type { AbilityKey } from "../../domain/common.js";
import type { FeatureChoice } from "../../domain/features.js";
import type { Character } from "../../domain/character.js";
import { SKILL_KEYS } from "../../domain/ids.js";
import { skills } from "../../data/skills.js";
import { tools } from "../../data/tools.js";
import { getWeaponsByCategory, weapons } from "../../rules/weapons.js";
import { getSkillExpertise, getSkillProficiency, isSkillGrantedExpertiseByMenteAgucadaChoice } from "../../rules/skills.js";
import { getEligibleTools } from "../../rules/tools.js";
import { useCharacterStore } from "../../state/characterStore.js";
import { getTalentChoiceOpportunity } from "../../recommendations/currentOpportunityContext.js";
import { getOptionPickTalentId } from "../../recommendations/opportunityKind.js";
import { useTalentRecommendations, withRecommendedLabel } from "../../services/useTalentRecommendations.js";
import { useBuildChoiceRecommendations } from "../../services/useBuildChoiceRecommendations.js";
import type { SkillKey } from "../../domain/ids.js";

export interface FeatureChoiceControlProps {
  choice: FeatureChoice;
}

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

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

  // Recomendações de Perícias/Especialização (só dados reais confirmados — ver
  // `recommendations/buildChoiceRecommendations.ts`): hook chamado sempre, antes de qualquer
  // retorno; só consulta para escolhas de perícia. Uma perícia que o personagem já tem por
  // OUTRA origem nunca é recomendada (seria redundante).
  const selectedSkills: string[] = Array.isArray(selection?.value) ? selection.value : [];
  const skillOptions: SkillKey[] =
    effect.kind === "skillProficiency"
      ? getSkillProficiencyChoiceOptions(effect, character, selectedSkills)
      : effect.kind === "skillExpertise"
        ? getSkillExpertiseChoiceOptions(effect, character, selectedSkills)
        : [];
  const eligibleSkills =
    effect.kind === "skillProficiency" ? skillOptions.filter((skillId) => selectedSkills.includes(skillId) || !getSkillProficiency(character, skillId)) : skillOptions;
  const recommendedSkills = useBuildChoiceRecommendations(skillOptions.length > 0 ? { kind: "skillChoice", choiceId: choice.id } : null, eligibleSkills);
  const skillLabel = (skillId: SkillKey) => withRecommendedLabel(skills[skillId].name, recommendedSkills.has(skillId));

  if (effect.kind === "skillProficiency") {
    const selected = selectedSkills;
    const options = skillOptions;
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
            <span>{skillLabel(skillId)}</span>
          </label>
        ))}
      </fieldset>
    );
  }

  if (effect.kind === "skillExpertise") {
    const selected = selectedSkills;
    const options = skillOptions;
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
            <span>{skillLabel(skillId)}</span>
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
    return <OptionPickChoiceControl choice={choice} options={effect.options} />;
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

  if (effect.kind === "skillOrToolProficiency") {
    // Habilidoso (fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E NO PDF" §8): qualquer combinação
    // de perícias E ferramentas/instrumentos compartilhando UM ÚNICO limite — nunca duas contagens
    // independentes, por isso um único controle que mistura as duas listas de opções, nunca dois
    // `FeatureChoiceControl` (um de `skillProficiency`, outro de `toolProficiency`) lado a lado.
    const selected = Array.isArray(selection?.value) ? selection.value : [];
    const skillOptions = SKILL_KEYS.filter((skillId) => selected.includes(skillId) || !getSkillProficiency(character, skillId));
    const toolOptions = getEligibleTools(effect.toolCategory);
    const atLimit = selected.length >= effect.count;
    return (
      <fieldset className="feature-choice">
        <legend>
          {choice.prompt} ({selected.length}/{effect.count})
        </legend>
        <p className="builder-step__hint">Perícias</p>
        {skillOptions.map((skillId) => (
          <label key={skillId} className="checkbox-field checkbox-field--compact">
            <input
              type="checkbox"
              checked={selected.includes(skillId)}
              disabled={!selected.includes(skillId) && atLimit}
              onChange={(e) => {
                const next = e.target.checked ? [...selected, skillId] : selected.filter((v) => v !== skillId);
                setFeatureChoiceSelection(choice.id, next);
              }}
            />
            <span>{skills[skillId].name}</span>
          </label>
        ))}
        <p className="builder-step__hint">Ferramentas e Instrumentos</p>
        {toolOptions.map((tool) => (
          <label key={tool.id} className="checkbox-field checkbox-field--compact">
            <input
              type="checkbox"
              checked={selected.includes(tool.id)}
              disabled={!selected.includes(tool.id) && atLimit}
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

  if (effect.kind === "abilityScoreIncrease") {
    // Talentos Gerais (fonte "COMPLETAR TALENTOS GERAIS NO BUILDER E NO PDF" §1): +1 num atributo à
    // escolha, limitado a 20 (teto aplicado na leitura, rules/abilities.ts#getEffectiveAbilityScore —
    // nunca aqui). `options` já vem restrita ao elegível (estática por talento, ou dinâmica para
    // Resiliente — rules/feats.ts#buildFeatAcquisitionFeature).
    const value = typeof selection?.value === "string" ? selection.value : "";
    return (
      <label className="field feature-choice">
        <span>{choice.prompt}</span>
        <select value={value} onChange={(e) => setFeatureChoiceSelection(choice.id, e.target.value)}>
          <option value="">- Selecione -</option>
          {effect.options.map((ability) => (
            <option key={ability} value={ability}>
              {ABILITY_NAMES[ability]}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (effect.kind === "skillProficiencyOrExpertise") {
    // Mente Aguçada (fonte §9): escolha ÚNICA entre um conjunto fixo de perícias, que vira
    // Proficiência OU Especialização dependendo do estado ATUAL — revalidado a cada leitura
    // (rules/skills.ts#isSkillGrantedExpertiseByMenteAgucadaChoice), nunca decidido aqui.
    const value = typeof selection?.value === "string" ? selection.value : "";
    return (
      <label className="field feature-choice">
        <span>{choice.prompt}</span>
        <select value={value} onChange={(e) => setFeatureChoiceSelection(choice.id, e.target.value)}>
          <option value="">- Selecione -</option>
          {effect.options.map((skillId) => {
            // Para a opção JÁ selecionada, usa a checagem que exclui a própria contribuição desta
            // escolha (nunca circular); para as demais, a proficiência atual já reflete corretamente
            // "o que aconteceria se esta fosse escolhida" (Mente Aguçada ainda não contribui para elas).
            const wouldBeExpertise = skillId === value ? isSkillGrantedExpertiseByMenteAgucadaChoice(character, skillId) : getSkillProficiency(character, skillId);
            return (
              <option key={skillId} value={skillId}>
                {skills[skillId].name}
                {wouldBeExpertise ? " (vira Especialização)" : " (concede Proficiência)"}
              </option>
            );
          })}
        </select>
      </label>
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

/**
 * `optionPick` genérico — componente próprio só para poder usar o hook
 * de recomendações incondicionalmente. Quando a escolha é a de um Estilo
 * de Luta ou de uma Dádiva Épica (`getTalentChoiceOpportunity`), até 3
 * opções da lista (já restrita às elegíveis por `rules/features.ts`)
 * ganham o sufixo "(Recomendado)"; o valor gravado continua sendo o
 * nome da opção, nunca o rótulo. Qualquer outra `optionPick` (ramo
 * Estilo de Luta/Combatente, listas, atributos…) nunca recebe rótulo.
 */
function OptionPickChoiceControl({ choice, options }: { choice: FeatureChoice; options: string[] }) {
  const character = useCharacterStore((s) => s.character);
  const setFeatureChoiceSelection = useCharacterStore((s) => s.setFeatureChoiceSelection);
  const selection = character.featureChoiceSelections[choice.id];
  const value = typeof selection?.value === "string" ? selection.value : "";

  const opportunity = getTalentChoiceOpportunity(character, choice.id);
  const talentKind = opportunity && (opportunity.kind === "fightingStyle" || opportunity.kind === "epicBoon") ? opportunity.kind : null;
  const talentIdOf = (option: string) => (talentKind ? getOptionPickTalentId(talentKind, option) : null);
  const eligibleTalentIds = options.map(talentIdOf).filter((id): id is string => id !== null);
  const recommended = useTalentRecommendations(talentKind ? opportunity : null, eligibleTalentIds);

  return (
    <label className="field feature-choice">
      <span>{choice.prompt}</span>
      <select value={value} onChange={(e) => setFeatureChoiceSelection(choice.id, e.target.value)}>
        <option value="">- Selecione -</option>
        {options.map((option) => {
          const talentId = talentIdOf(option);
          return (
            <option key={option} value={option}>
              {withRecommendedLabel(option, talentId !== null && recommended.has(talentId))}
            </option>
          );
        })}
      </select>
    </label>
  );
}

type SkillProficiencyEffect = Extract<FeatureChoice["effect"], { kind: "skillProficiency" }>;
type SkillExpertiseEffect = Extract<FeatureChoice["effect"], { kind: "skillExpertise" }>;

/**
 * Opções exibidas numa escolha de proficiência em perícia. Uma perícia já
 * SELECIONADA nesta mesma escolha nunca some da lista, mesmo que
 * `excludeAlreadyProficient` esteja ligado — senão a própria seleção (que
 * concede a proficiência) faria a opção desaparecer assim que marcada
 * (Conhecimento Primordial).
 */
function getSkillProficiencyChoiceOptions(effect: SkillProficiencyEffect, character: Character, selected: string[]): SkillKey[] {
  const allOptions = effect.options === "any" ? [...SKILL_KEYS] : effect.options;
  return effect.excludeAlreadyProficient ? allOptions.filter((skillId) => selected.includes(skillId) || !getSkillProficiency(character, skillId)) : allOptions;
}

/**
 * Opções exibidas numa escolha de Especialização: só perícias já
 * proficientes E AINDA sem Especialização (nunca concede a proficiência,
 * nunca reaplica Especialização numa perícia que já a tenha por outra
 * escolha — ex.: Explorador Hábil e Especialista do Patrulheiro nunca
 * podem repetir a mesma perícia); uma perícia já SELECIONADA nesta mesma
 * escolha nunca some, mesmo que isso mude depois.
 */
function getSkillExpertiseChoiceOptions(effect: SkillExpertiseEffect, character: Character, selected: string[]): SkillKey[] {
  return SKILL_KEYS.filter(
    (skillId) =>
      (!effect.options || effect.options.includes(skillId)) &&
      (selected.includes(skillId) || (getSkillProficiency(character, skillId) && !getSkillExpertise(character, skillId))),
  );
}
