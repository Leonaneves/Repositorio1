import { useCharacterStore } from "../../../state/characterStore.js";
import { BACKGROUND_IDS } from "../../../domain/ids.js";
import { backgrounds, getBackgroundAbilityAllocationConfig } from "../../../data/backgrounds.js";
import { skills } from "../../../data/skills.js";

/**
 * Etapa 5 — escolha de antecedente, informações e benefícios já
 * cadastrados. A DISTRIBUIÇÃO dos Aumentos de Atributo do Antecedente
 * não acontece mais aqui (fonte "REORGANIZAR O BUILDER E CORRIGIR
 * VALIDAÇÕES EXISTENTES" §3: "a escolha de quais atributos aumentar
 * deve acontecer somente na etapa Atributos") — só um aviso apontando
 * para lá. O estado (`backgroundAbilityBonuses`) e as regras
 * (`getBackgroundAbilityAllocationConfig`) continuam exatamente como
 * antes; só a UI de distribuição mudou de lugar.
 */
export function Step5Background() {
  const character = useCharacterStore((s) => s.character);
  const backgroundId = character.backgroundId;
  const setBackground = useCharacterStore((s) => s.setBackground);

  const config = backgroundId ? getBackgroundAbilityAllocationConfig(backgroundId) : null;

  return (
    <div className="builder-step" aria-label="Antecedente">
      <label className="field">
        <span>Antecedente</span>
        <select
          value={backgroundId ?? ""}
          onChange={(e) => setBackground(e.target.value ? (e.target.value as (typeof BACKGROUND_IDS)[number]) : null)}
        >
          <option value="">- Selecione -</option>
          {BACKGROUND_IDS.map((id) => (
            <option key={id} value={id}>
              {backgrounds[id].name}
            </option>
          ))}
        </select>
      </label>
      {backgroundId && (
        <p className="builder-step__hint">
          Perícias: {backgrounds[backgroundId].grantedSkills.map((skillId) => skills[skillId].name).join(", ")}
          <br />
          Talento de Origem: {backgrounds[backgroundId].originFeat}
        </p>
      )}

      {config && (
        <p className="builder-step__hint">
          Aumentos de Atributo disponíveis: {config.eligibleAbilities.join(", ")} (distribua {config.totalPoints}{" "}
          {config.totalPoints === 1 ? "ponto" : "pontos"}, máximo +{config.maxPerAbility} por atributo). Distribua os aumentos na etapa Atributos.
        </p>
      )}
    </div>
  );
}
