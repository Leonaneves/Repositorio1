import { useCharacterStore } from "../../../state/characterStore.js";
import { ELEMENTAL_AFFINITY_CHOICE_ID, ELEMENTAL_AFFINITY_OPTIONS } from "../../../data/features/subclasses.js";

/**
 * Seção "Afinidade Elemental" (Feitiçaria Dracônica, nível 6 — fonte
 * "INTEGRAÇÃO COMPLETA — FEITICEIRO, METAMAGIA E SUBCLASSES" §36),
 * renderizada DENTRO da etapa Classe — `Step2Class` só monta este
 * componente quando `isElementalAffinityApplicable` é verdadeiro.
 * Mesma arquitetura de `StepEarthCircleTerrain`: armazenada em
 * `featureChoiceSelections`, mas com UI dedicada, agora como seção em
 * vez de etapa própria (fonte "REORGANIZAR O BUILDER..." §2). A fonte
 * não informa troca posterior — tratada como escolha duradoura fixa (o
 * campo continua tecnicamente editável, como qualquer
 * `FeatureChoiceSelection`, mas a regra narrativa não prevê re-escolha).
 */
export function StepElementalAffinity() {
  const character = useCharacterStore((s) => s.character);
  const setFeatureChoiceSelection = useCharacterStore((s) => s.setFeatureChoiceSelection);

  const selection = character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID]?.value;
  const current = typeof selection === "string" ? selection : "";

  return (
    <section className="feature-card" aria-label="Afinidade Elemental">
      <h3>Afinidade Elemental</h3>
      <p className="builder-step__hint">
        Escolha o tipo elemental — concede Resistência a esse tipo e soma o modificador de Carisma em 1 rolagem de dano quando conjurar uma magia
        desse tipo. A fonte não prevê trocar essa escolha depois.
      </p>
      <fieldset className="feature-choice">
        <legend>Tipo</legend>
        {ELEMENTAL_AFFINITY_OPTIONS.map((type) => (
          <label key={type} className="checkbox-field checkbox-field--compact">
            <input
              type="radio"
              name="elemental-affinity"
              value={type}
              checked={current === type}
              onChange={() => setFeatureChoiceSelection(ELEMENTAL_AFFINITY_CHOICE_ID, type)}
            />
            {type}
          </label>
        ))}
      </fieldset>
    </section>
  );
}
