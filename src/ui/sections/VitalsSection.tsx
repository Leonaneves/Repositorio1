import { useCharacterStore } from "../../state/characterStore.js";
import { SIZE_OPTIONS } from "../../domain/ids.js";
import { getInitiative, getPassivePerception } from "../../rules/derived.js";
import { getSize } from "../../rules/size.js";
import { getSpeed } from "../../rules/speed.js";
import { ComputedField } from "../components/ComputedField.js";

/**
 * Tira de 4 caixinhas lado a lado — Iniciativa, Deslocamento, Tamanho,
 * Percepção Passiva — como na faixa correspondente da ficha original,
 * logo abaixo do cabeçalho.
 */
export function VitalsSection() {
  const character = useCharacterStore((s) => s.character);
  const setInitiativeManualAdjustment = useCharacterStore((s) => s.setInitiativeManualAdjustment);
  const setSpeedManualAdjustment = useCharacterStore((s) => s.setSpeedManualAdjustment);
  const setPassivePerceptionManualAdjustment = useCharacterStore((s) => s.setPassivePerceptionManualAdjustment);
  const setSizeManualOverride = useCharacterStore((s) => s.setSizeManualOverride);

  const size = getSize(character);

  return (
    <div className="vitals-strip">
      <div className="vital-box">
        <span className="vital-box__label">Iniciativa</span>
        <ComputedField label="Iniciativa" computed={getInitiative(character)} onManualChange={setInitiativeManualAdjustment} />
      </div>

      <div className="vital-box">
        <span className="vital-box__label">Deslocamento</span>
        <span className="vital-box__value">
          <ComputedField label="Deslocamento" computed={getSpeed(character)} onManualChange={setSpeedManualAdjustment} variant="value" />
          <span className="vital-box__unit">m</span>
        </span>
      </div>

      <div className="vital-box">
        <span className="vital-box__label">Tamanho</span>
        <select
          className="vital-box__select"
          value={size.manual ?? ""}
          onChange={(e) => setSizeManualOverride(e.target.value ? (e.target.value as (typeof SIZE_OPTIONS)[number]) : null)}
          aria-label="Tamanho (automático pela espécie, ou escolha manual)"
        >
          <option value="">{size.auto ?? "—"} (auto)</option>
          {SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="vital-box">
        <span className="vital-box__label">Percepção Passiva</span>
        <ComputedField
          label="Percepção Passiva"
          computed={getPassivePerception(character)}
          onManualChange={setPassivePerceptionManualAdjustment}
          variant="value"
        />
      </div>
    </div>
  );
}
