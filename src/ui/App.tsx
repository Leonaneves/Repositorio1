import { useBuildSync } from "../services/buildSync.js";
import { useInsights, findInsightByMetric } from "../services/useInsights.js";
import { IdentitySection } from "./sections/IdentitySection.js";
import { AbilitiesSection } from "./sections/AbilitiesSection.js";
import { SkillsSection } from "./sections/SkillsSection.js";
import { SavingThrowsSection } from "./sections/SavingThrowsSection.js";
import { CombatSection } from "./sections/CombatSection.js";
import { ArmorSection } from "./sections/ArmorSection.js";
import { SpellcastingSection } from "./sections/SpellcastingSection.js";

export function App() {
  useBuildSync();
  const { insights } = useInsights();

  return (
    <main className="sheet">
      <h1>Ficha de Personagem — D&amp;D 2024</h1>

      <IdentitySection
        subclassPopularity={findInsightByMetric(insights, "subclassPopularity")}
        speciesPopularity={findInsightByMetric(insights, "speciesPopularity")}
        backgroundPopularity={findInsightByMetric(insights, "backgroundPopularity")}
      />
      <AbilitiesSection abilityHighest={findInsightByMetric(insights, "abilityHighest")} />
      <SkillsSection />
      <SavingThrowsSection />
      <CombatSection />
      <ArmorSection armorPopularity={findInsightByMetric(insights, "armorPopularity")} />
      <SpellcastingSection />
    </main>
  );
}
