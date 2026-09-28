import { SpellcastingSection } from "../../sections/SpellcastingSection.js";

/** Etapa 10 (condicional) — reaproveita a seção de Conjuração já existente da Ficha Web. */
export function Step10Spellcasting() {
  return (
    <div className="builder-step" aria-label="Conjuração">
      <SpellcastingSection />
    </div>
  );
}
