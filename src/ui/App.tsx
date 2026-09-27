import { useBuildSync } from "../services/buildSync.js";
import { useInsights, findInsightByMetric } from "../services/useInsights.js";
import { IdentitySection } from "./sections/IdentitySection.js";
import { AbilitiesSection } from "./sections/AbilitiesSection.js";
import { VitalsSection } from "./sections/VitalsSection.js";
import { ArmorSection } from "./sections/ArmorSection.js";
import { SpellcastingSection } from "./sections/SpellcastingSection.js";

export function App() {
  useBuildSync();
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
