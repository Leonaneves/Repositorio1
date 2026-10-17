import { useCharacterStore } from "../../../state/characterStore.js";
import { useBuilderUiStore } from "../../../state/builderUiStore.js";
import { ABILITY_KEYS, type AbilityKey } from "../../../domain/common.js";
import type { SkillKey } from "../../../domain/ids.js";
import { skillsByAbility, skills } from "../../../data/skills.js";
import { getFeatureView, getSkillChoiceFeatures } from "../../../rules/features.js";
import { getAutomaticSkillProficiencyGrants } from "../../../rules/skills.js";
import { getInvalidExpertiseSelections, getRedundantSkillChoiceSelections } from "../../../rules/skillChoiceConflicts.js";
import { SkillRow } from "../../sections/SkillsSection.js";
import { FeatureChoiceControl } from "../FeatureChoiceControl.js";

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

const AUTOMATIC_ORIGIN_LABELS: Record<"background" | "subclass" | "feat", string> = {
  background: "Antecedente",
  subclass: "Subclasse",
  feat: "Talento",
};

/**
 * Etapa "Perícias" (fonte "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA
 * ETAPA PRÓPRIA") — reúne TUDO que concede ou escolhe perícia, de
 * qualquer origem (Classe, Subclasse, Espécie, Antecedente, Talento),
 * numa única etapa própria, posicionada depois de todas elas e antes
 * da Revisão (`rules/builderSteps.ts`). Substitui a decisão anterior
 * (fonte "AJUSTES NO PDF, FORMA SELVAGEM E EDIÇÃO DE PERÍCIAS" §3) de
 * nunca ter etapa lateral e manter a edição só pelo botão "Editar" da
 * Revisão — esse botão agora só navega para esta etapa
 * (`SkillsEditModal` foi aposentado, tarefa seguinte).
 *
 * 4 seções, nesta ordem (§2 da fonte):
 * 1. Concessões automáticas (sem escolha alguma) — hoje só Antecedente
 *    (`getAutomaticSkillProficiencyGrants`); nunca editável aqui, só no
 *    Antecedente.
 * 2. Escolhas de proficiência — uma `FeatureChoiceControl` por escolha,
 *    agrupada pela feature dona, de QUALQUER origem
 *    (`getSkillChoiceFeatures`) — cada bloco mantém sua própria lista/
 *    quantidade, nunca fundidas visualmente numa só.
 * 3. Especialização — mesma ideia, só para escolhas `skillExpertise`
 *    (nunca perícias de Idiomas/Ferramentas/Salvaguardas, que não
 *    migram para esta etapa).
 * 4. Homebrew — grade completa de perícias (`SkillRow`, reaproveitado
 *    sem alteração) para sobrescrever proficiência/Especialização
 *    manualmente; o toggle NUNCA é resetado ao entrar aqui — etapa
 *    permanente, não mais um modal transitório.
 *
 * O filtro "esconder perícia já possuída" por bloco de escolha já é
 * tratado dentro de `FeatureChoiceControl` (`excludeAlreadyProficient`)
 * — nunca duplicado aqui.
 *
 * Conflitos (§4): uma seleção de proficiência que ficou redundante
 * (já concedida por outra origem,
 * `getRedundantSkillChoiceSelections`) ou uma Especialização que
 * perdeu a proficiência de origem (`getInvalidExpertiseSelections`)
 * NUNCA são escondidas ou corrigidas sozinhas — ficam visíveis no
 * próprio bloco que as criou, destacadas com aviso, para o jogador
 * corrigir manualmente (nunca uma substituição automática).
 */
export function StepSkills() {
  const character = useCharacterStore((s) => s.character);
  const homebrew = useBuilderUiStore((s) => s.skillsHomebrew);
  const toggleSkillsHomebrew = useBuilderUiStore((s) => s.toggleSkillsHomebrew);

  const automaticGrants = getAutomaticSkillProficiencyGrants(character);

  const skillChoiceFeatures = getSkillChoiceFeatures(character);
  const proficiencyBlocks = skillChoiceFeatures
    .map((feature) => ({ feature, choices: (feature.choices ?? []).filter((choice) => choice.effect.kind === "skillProficiency") }))
    .filter((entry) => entry.choices.length > 0);
  const expertiseBlocks = skillChoiceFeatures
    .map((feature) => ({ feature, choices: (feature.choices ?? []).filter((choice) => choice.effect.kind === "skillExpertise") }))
    .filter((entry) => entry.choices.length > 0);

  const redundantByChoice = new Map<string, SkillKey[]>();
  for (const entry of getRedundantSkillChoiceSelections(character)) {
    redundantByChoice.set(entry.choiceId, [...(redundantByChoice.get(entry.choiceId) ?? []), entry.skill]);
  }
  const invalidExpertiseByChoice = new Map<string, SkillKey[]>();
  for (const entry of getInvalidExpertiseSelections(character)) {
    invalidExpertiseByChoice.set(entry.choiceId, [...(invalidExpertiseByChoice.get(entry.choiceId) ?? []), entry.skill]);
  }

  return (
    <div className="builder-step" aria-label="Perícias">
      <section className="review-block">
        <h3>Perícias concedidas automaticamente</h3>
        {automaticGrants.length === 0 && <p className="empty-note">Nenhuma concessão automática de perícia registrada ainda.</p>}
        {automaticGrants.length > 0 && (
          <ul className="review-inline-list">
            {automaticGrants.map(({ skill, origins }) => (
              <li key={skill}>
                {skills[skill].name} — {origins.map((origin) => AUTOMATIC_ORIGIN_LABELS[origin]).join(", ")}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="review-block">
        <h3>Escolhas de Proficiência</h3>
        {proficiencyBlocks.length === 0 && <p className="empty-note">Nenhuma escolha de proficiência pendente neste momento.</p>}
        {proficiencyBlocks.map(({ feature, choices }) => {
          const view = getFeatureView(feature);
          return (
            <div key={feature.id} className="review-subsection">
              <h4>
                {view.originLabel} — {view.name}
              </h4>
              {choices.map((choice) => {
                const flagged = redundantByChoice.get(choice.id);
                return (
                  <div key={choice.id} className={flagged ? "review-block--pending" : undefined}>
                    <FeatureChoiceControl choice={choice} />
                    {flagged && (
                      <p className="builder-step__hint">
                        ⚠ {flagged.map((skillId) => skills[skillId].name).join(", ")} já concedida(s) por outra origem — ajuste esta seleção (nada é
                        substituído automaticamente).
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>

      <section className="review-block">
        <h3>Especialização</h3>
        {expertiseBlocks.length === 0 && <p className="empty-note">Nenhuma escolha de Especialização disponível neste momento.</p>}
        {expertiseBlocks.map(({ feature, choices }) => {
          const view = getFeatureView(feature);
          return (
            <div key={feature.id} className="review-subsection">
              <h4>
                {view.originLabel} — {view.name}
              </h4>
              {choices.map((choice) => {
                const flagged = invalidExpertiseByChoice.get(choice.id);
                return (
                  <div key={choice.id} className={flagged ? "review-block--pending" : undefined}>
                    <FeatureChoiceControl choice={choice} />
                    {flagged && (
                      <p className="builder-step__hint">
                        ⚠ {flagged.map((skillId) => skills[skillId].name).join(", ")} perdeu a proficiência de origem — escolha outra perícia (nada
                        é substituído automaticamente).
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </section>

      <section className="review-block">
        <h3>Todas as perícias</h3>
        <button type="button" className="homebrew-toggle" onClick={toggleSkillsHomebrew} aria-pressed={homebrew}>
          ✎ {homebrew ? "Desativar edição manual (Homebrew)" : "Editar perícias manualmente (Homebrew)"}
        </button>
        {homebrew && <p className="builder-step__hint">Modo manual / Homebrew ativo — qualquer perícia pode ser marcada/desmarcada livremente.</p>}

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
    </div>
  );
}
