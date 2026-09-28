import { useState } from "react";
import { useBuildSync } from "../services/buildSync.js";
import { useInsights, findInsightByMetric } from "../services/useInsights.js";
import { IdentitySection } from "./sections/IdentitySection.js";
import { AbilitiesSection } from "./sections/AbilitiesSection.js";
import { VitalsSection } from "./sections/VitalsSection.js";
import { ArmorSection } from "./sections/ArmorSection.js";
import { SpellcastingSection } from "./sections/SpellcastingSection.js";
import { BuilderWizard } from "./builder/BuilderWizard.js";

type AppMode = "builder" | "sheet";

/** Ficha Web (pós-criação/consulta) — o conteúdo que já existia antes do Builder, sem alterações. */
function CharacterSheet() {
  const { insights } = useInsights();

  return (
    <div className="sheet">
      <div className="sheet-frame">
        <IdentitySection
          subclassPopularity={findInsightByMetric(insights, "subclassPopularity")}
          speciesPopularity={findInsightByMetric(insights, "speciesPopularity")}
          backgroundPopularity={findInsightByMetric(insights, "backgroundPopularity")}
        />

        <div className="sheet-divider" role="presentation">
          <span>Dungeons &amp; Dragons</span>
        </div>

        <VitalsSection />

        <div className="sheet-main">
          <AbilitiesSection abilityHighest={findInsightByMetric(insights, "abilityHighest")} />

          <div className="sheet-column-right">
            <ArmorSection armorPopularity={findInsightByMetric(insights, "armorPopularity")} />
            <SpellcastingSection />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * O Builder é a interface primária de criação (decisão aprovada §10);
 * a Ficha Web (o conteúdo que já existia) fica disponível para
 * consulta/edição direta a qualquer momento — os dois modos leem e
 * escrevem o mesmo `useCharacterStore`, então trocar de aba nunca perde
 * nada do personagem em construção.
 */
export function App() {
  useBuildSync();
  const [mode, setMode] = useState<AppMode>("builder");

  return (
    <div className="app-shell">
      <nav className="app-mode-switch" aria-label="Modo">
        <button type="button" aria-pressed={mode === "builder"} onClick={() => setMode("builder")}>
          Criar Personagem
        </button>
        <button type="button" aria-pressed={mode === "sheet"} onClick={() => setMode("sheet")}>
          Ficha
        </button>
      </nav>

      {mode === "builder" ? <BuilderWizard /> : <CharacterSheet />}
    </div>
  );
}
