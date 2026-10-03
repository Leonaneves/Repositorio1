import { useCharacterStore } from "../../../state/characterStore.js";
import { getWildShapeFormsConfig, validateKnownWildShapeForm } from "../../../rules/wildShapeForms.js";

/**
 * Etapa PRÓPRIA do Builder — "Formas Conhecidas" de Forma Selvagem
 * (fonte "INTEGRAÇÃO COMPLETA — DRUIDA E SUBCLASSES" §8) — só visível
 * para Druida a partir do nível 2 (rules/builderSteps.ts). Modelo
 * PRÓPRIO, fora do `FeatureChoiceControl` genérico, mesmo raciocínio de
 * `StepInvocations`: a validação cruzada (quantidade/ND/Voo conforme o
 * nível) não cabe em "uma escolha, N opções fixas". Sem catálogo de
 * Feras no projeto: nome é texto livre; ND e Voo são campos
 * estruturados que o Builder valida, mas confia no jogador para
 * preencher corretamente (mesma confiança já dada a nomes de magia
 * manual).
 */
export function StepWildShapeForms() {
  const character = useCharacterStore((s) => s.character);
  const addKnownWildShapeForm = useCharacterStore((s) => s.addKnownWildShapeForm);
  const updateKnownWildShapeForm = useCharacterStore((s) => s.updateKnownWildShapeForm);
  const removeKnownWildShapeForm = useCharacterStore((s) => s.removeKnownWildShapeForm);

  const config = getWildShapeFormsConfig(character.level);
  const filledCount = character.knownWildShapeForms.filter((f) => f.name.trim().length > 0).length;
  const canAddMore = character.knownWildShapeForms.length < config.count;

  return (
    <div className="builder-step" aria-label="Formas Conhecidas">
      <p className="builder-step__hint">
        Formas conhecidas: {filledCount}/{config.count} — ND máximo {config.maxChallengeRating} — Deslocamento de Voo{" "}
        {config.flyAllowed ? "permitido" : "não permitido"} neste nível. Selecione entre Feras elegíveis; após um Descanso Longo pode substituir 1
        forma conhecida.
      </p>

      {character.knownWildShapeForms.length > 0 && (
        <ul className="trait-list">
          {character.knownWildShapeForms.map((form, index) => {
            const validation = validateKnownWildShapeForm(form, config);
            return (
              <li key={index} className="feature-card">
                <label className="field">
                  <span>Nome da Fera</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateKnownWildShapeForm(index, { name: e.target.value })}
                    placeholder="Ex.: Lobo"
                  />
                </label>
                <label className="field">
                  <span>Nível de Desafio (ND)</span>
                  <input
                    type="text"
                    value={form.challengeRating}
                    onChange={(e) => updateKnownWildShapeForm(index, { challengeRating: e.target.value })}
                    placeholder='Ex.: "1/4", "1/2", "1"'
                  />
                </label>
                <label className="checkbox-field checkbox-field--compact">
                  <input
                    type="checkbox"
                    checked={form.hasFlySpeed}
                    onChange={(e) => updateKnownWildShapeForm(index, { hasFlySpeed: e.target.checked })}
                  />
                  Tem Deslocamento de Voo
                </label>
                {validation.challengeRatingOk === false && (
                  <p className="builder-step__hint" style={{ color: "crimson" }}>
                    ND acima do máximo permitido neste nível ({config.maxChallengeRating}).
                  </p>
                )}
                {!validation.flySpeedOk && (
                  <p className="builder-step__hint" style={{ color: "crimson" }}>
                    Deslocamento de Voo não é permitido neste nível.
                  </p>
                )}
                <button type="button" onClick={() => removeKnownWildShapeForm(index)}>
                  Remover
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button type="button" disabled={!canAddMore} onClick={addKnownWildShapeForm}>
        + Adicionar Forma Conhecida {canAddMore ? "" : "(limite do nível já atingido)"}
      </button>
    </div>
  );
}
