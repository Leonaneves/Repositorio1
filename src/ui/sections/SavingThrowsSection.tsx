import { useCharacterStore } from "../../state/characterStore.js";
import type { AbilityKey } from "../../domain/common.js";
import { getSavingThrow } from "../../rules/savingThrows.js";
import { ComputedField } from "../components/ComputedField.js";

export interface SavingThrowRowProps {
  ability: AbilityKey;
}

/**
 * Uma linha de salvaguarda — usada dentro do card de cada atributo
 * (ver AbilitiesSection), como na ficha original, onde "Salvaguarda"
 * é sempre a primeira caixa de perícia de cada atributo, não uma
 * seção separada.
 */
export function SavingThrowRow({ ability }: SavingThrowRowProps) {
  const character = useCharacterStore((s) => s.character);
  const setSavingThrowProficient = useCharacterStore((s) => s.setSavingThrowProficient);
  const setSavingThrowManualAdjustment = useCharacterStore((s) => s.setSavingThrowManualAdjustment);
  const state = character.savingThrows[ability];

  return (
    <li className="trait-row trait-row--save">
      <label className="trait-row__check">
        <input type="checkbox" checked={state.proficient} onChange={(e) => setSavingThrowProficient(ability, e.target.checked)} />
        <span>Salvaguarda</span>
      </label>
      <ComputedField label={`salvaguarda de ${ability}`} computed={getSavingThrow(character, ability)} onManualChange={(v) => setSavingThrowManualAdjustment(ability, v)} />
    </li>
  );
}
