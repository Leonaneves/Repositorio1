import type { ComputedValue } from "../../domain/common.js";

function formatSigned(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export interface ComputedFieldProps {
  label: string;
  computed: ComputedValue;
  onManualChange: (value: number) => void;
}

/**
 * Visualização única para qualquer valor "auto + manual = total" do
 * motor de regras — usada por perícias, salvaguardas, iniciativa,
 * percepção passiva, CA, CD de magia, ataque mágico e deslocamento.
 * Mostra as três partes lado a lado de propósito: o valor automático
 * NUNCA é substituído pelo ajuste manual, os dois convivem e o total
 * é sempre derivado (nunca digitado diretamente).
 */
export function ComputedField({ label, computed, onManualChange }: ComputedFieldProps) {
  return (
    <div className="computed-field">
      <span className="computed-field__label">{label}</span>
      <span className="computed-field__auto" title="Valor automático (calculado pelo motor de regras)">
        auto {formatSigned(computed.auto)}
      </span>
      <span className="computed-field__sign">+</span>
      <input
        type="number"
        className="computed-field__manual"
        value={computed.manual}
        onChange={(event) => onManualChange(Number(event.target.value) || 0)}
        title="Ajuste manual"
        aria-label={`Ajuste manual de ${label}`}
      />
      <span className="computed-field__sign">=</span>
      <span className="computed-field__total">{formatSigned(computed.total)}</span>
    </div>
  );
}
