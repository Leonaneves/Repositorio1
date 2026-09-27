import { useEffect, useRef, useState } from "react";
import type { ComputedValue } from "../../domain/common.js";

function formatSigned(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export interface ComputedFieldProps {
  label: string;
  computed: ComputedValue;
  onManualChange: (value: number) => void;
  /** "value" (padrão): mostra só o número, sem sinal (ex.: CD, CA). "modifier": mostra com sinal (+/-, ex.: perícias, iniciativa). */
  variant?: "value" | "modifier";
}

/**
 * Continua guardando internamente `auto`/`manual`/`total` — nada disso
 * muda — mas a apresentação é compacta (§6): o total é o que domina
 * visualmente; o ajuste manual só aparece como um selo pequeno quando
 * existe, e fica editável por trás de uma ação contextual pequena
 * (ícone de lápis), não por três caixas grandes lado a lado.
 */
export function ComputedField({ label, computed, onManualChange, variant = "modifier" }: ComputedFieldProps) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const display = variant === "modifier" ? formatSigned(computed.total) : String(computed.total);
  const title = `Automático: ${formatSigned(computed.auto)}${computed.manual !== 0 ? ` · Ajuste manual: ${formatSigned(computed.manual)}` : ""}`;

  return (
    <span className="cv" title={title}>
      <span className="cv__total" aria-live="polite">
        {display}
      </span>
      {computed.manual !== 0 && !editing && (
        <span className="cv__manual-badge" aria-hidden="true">
          {formatSigned(computed.manual)}
        </span>
      )}
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          className="cv__input"
          value={computed.manual}
          aria-label={label ? `Ajuste manual de ${label}` : "Ajuste manual"}
          onChange={(e) => onManualChange(Number(e.target.value) || 0)}
          onBlur={() => setEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") setEditing(false);
          }}
        />
      ) : (
        <button
          type="button"
          className="cv__adjust"
          aria-label={label ? `Ajustar ${label} manualmente` : "Ajustar manualmente"}
          onClick={() => setEditing(true)}
        >
          ✎
        </button>
      )}
    </span>
  );
}
