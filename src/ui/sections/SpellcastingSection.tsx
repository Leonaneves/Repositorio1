import { useCharacterStore } from "../../state/characterStore.js";
import { SPELL_CIRCLES } from "../../domain/ids.js";
import {
  getSpellAttackBonus,
  getSpellcastingAbility,
  getSpellSaveDC,
  getSpellSlots,
} from "../../rules/spellcasting.js";
import { ComputedField } from "../components/ComputedField.js";

export function SpellcastingSection() {
  const character = useCharacterStore((s) => s.character);
  const setSpellSaveDCManualAdjustment = useCharacterStore((s) => s.setSpellSaveDCManualAdjustment);
  const setSpellAttackBonusManualAdjustment = useCharacterStore((s) => s.setSpellAttackBonusManualAdjustment);
  const setSpellSlotExpended = useCharacterStore((s) => s.setSpellSlotExpended);

  const ability = getSpellcastingAbility(character);
  const saveDC = getSpellSaveDC(character);
  const attackBonus = getSpellAttackBonus(character);
  const slots = getSpellSlots(character);
  const circlesWithSlots = SPELL_CIRCLES.filter((circle) => slots[circle] > 0);

  return (
    <section className="sheet-section" aria-label="Conjuração">
      <h2>Conjuração</h2>

      {!ability && <p>Este personagem não tem atributo de conjuração.</p>}

      {ability && (
        <>
          <p>
            Atributo de conjuração: <strong>{ability}</strong>
          </p>
          {saveDC && <ComputedField label="CD de Magia" computed={saveDC} onManualChange={setSpellSaveDCManualAdjustment} />}
          {attackBonus && (
            <ComputedField label="Ataque Mágico" computed={attackBonus} onManualChange={setSpellAttackBonusManualAdjustment} />
          )}
        </>
      )}

      <h3>Espaços de Magia</h3>
      {circlesWithSlots.length === 0 && <p>Nenhum espaço de magia neste nível.</p>}
      {circlesWithSlots.length > 0 && (
        <ul className="spell-slot-list">
          {circlesWithSlots.map((circle) => (
            <li key={circle} className="spell-slot-row">
              <span>{circle}º Círculo</span>
              <span>
                Total: <strong>{slots[circle]}</strong>
              </span>
              <label>
                Gastos:
                <input
                  type="number"
                  min={0}
                  max={slots[circle]}
                  value={character.spellcasting.slots[circle].expended}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (value >= 0 && value <= slots[circle]) setSpellSlotExpended(circle, value);
                  }}
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
