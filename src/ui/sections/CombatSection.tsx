import { useCharacterStore } from "../../state/characterStore.js";
import { getInitiative, getPassivePerception } from "../../rules/derived.js";
import { ComputedField } from "../components/ComputedField.js";

export function CombatSection() {
  const character = useCharacterStore((s) => s.character);
  const setInitiativeManualAdjustment = useCharacterStore((s) => s.setInitiativeManualAdjustment);
  const setPassivePerceptionManualAdjustment = useCharacterStore((s) => s.setPassivePerceptionManualAdjustment);

  return (
    <section className="sheet-section" aria-label="Iniciativa e Percepção Passiva">
      <h2>Iniciativa &amp; Percepção Passiva</h2>
      <ComputedField label="Iniciativa" computed={getInitiative(character)} onManualChange={setInitiativeManualAdjustment} />
      <ComputedField
        label="Percepção Passiva"
        computed={getPassivePerception(character)}
        onManualChange={setPassivePerceptionManualAdjustment}
      />
    </section>
  );
}
