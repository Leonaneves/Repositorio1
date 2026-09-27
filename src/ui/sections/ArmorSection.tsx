import { useCharacterStore } from "../../state/characterStore.js";
import { armors } from "../../data/armors.js";
import { getArmorClass, getAvailableArmor } from "../../rules/armor.js";
import { ComputedField } from "../components/ComputedField.js";
import type { ChoiceInsight } from "../../analytics/types.js";
import { InsightCard } from "../insights/InsightCard.js";

export interface ArmorSectionProps {
  armorPopularity?: ChoiceInsight;
}

const PROFICIENCY_LABELS = {
  light: "Armaduras Leves",
  medium: "Armaduras Médias",
  heavy: "Armaduras Pesadas",
  shield: "Escudos",
} as const;

export function ArmorSection({ armorPopularity }: ArmorSectionProps) {
  const character = useCharacterStore((s) => s.character);
  const setArmorProficiency = useCharacterStore((s) => s.setArmorProficiency);
  const setArmorEquipped = useCharacterStore((s) => s.setArmorEquipped);
  const setShield = useCharacterStore((s) => s.setShield);
  const setArmorManualAdjustment = useCharacterStore((s) => s.setArmorManualAdjustment);

  const available = getAvailableArmor(character);

  return (
    <section className="sheet-section" aria-label="Armadura e Classe de Armadura">
      <h2>Armadura / CA</h2>

      <fieldset className="armor-proficiencies">
        <legend>Treinamento em armaduras</legend>
        {(Object.keys(PROFICIENCY_LABELS) as (keyof typeof PROFICIENCY_LABELS)[]).map((category) => (
          <label key={category} className="checkbox-field">
            <input
              type="checkbox"
              checked={character.armor.proficiencies[category]}
              onChange={(e) => setArmorProficiency(category, e.target.checked)}
            />
            <span>{PROFICIENCY_LABELS[category]}</span>
          </label>
        ))}
      </fieldset>

      <label className="field">
        <span>Armadura equipada</span>
        <select value={character.armor.equipped} onChange={(e) => setArmorEquipped(e.target.value as typeof character.armor.equipped)}>
          <option value="unarmed">Sem Armadura</option>
          {available.map((armor) => (
            <option key={armor.id} value={armor.id}>
              {armor.name}
            </option>
          ))}
        </select>
      </label>

      <label className="checkbox-field">
        <input type="checkbox" checked={character.armor.shield} onChange={(e) => setShield(e.target.checked)} />
        <span>Usando escudo agora</span>
      </label>

      <ComputedField label="Classe de Armadura" computed={getArmorClass(character)} onManualChange={setArmorManualAdjustment} />

      {armorPopularity && <InsightCard insight={armorPopularity} />}
    </section>
  );
}
