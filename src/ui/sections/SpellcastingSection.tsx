import { useCharacterStore } from "../../state/characterStore.js";
import { SPELL_CIRCLES } from "../../domain/ids.js";
import { getSpellAttackBonus, getSpellcastingAbility, getSpellSaveDC, getSpellSlots } from "../../rules/spellcasting.js";
import { ComputedField } from "../components/ComputedField.js";

const ABILITY_NAMES: Record<string, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

export function SpellcastingSection() {
  const character = useCharacterStore((s) => s.character);
  const setSpellSaveDCManualAdjustment = useCharacterStore((s) => s.setSpellSaveDCManualAdjustment);
  const setSpellAttackBonusManualAdjustment = useCharacterStore((s) => s.setSpellAttackBonusManualAdjustment);
  const setSpellSlotExpended = useCharacterStore((s) => s.setSpellSlotExpended);

  const ability = getSpellcastingAbility(character);

  // §11: personagem sem nenhuma fonte de conjuração não precisa de uma
  // grande seção vazia — mantém uma área compacta e desativada, em vez
  // de ocultar por completo (a ficha original sempre reserva o espaço).
  if (!ability) {
    return (
      <section className="sheet-section sheet-section--spellcasting sheet-section--empty" aria-label="Conjuração">
        <h2>Conjuração</h2>
        <p className="empty-note">Este personagem não tem uma fonte de conjuração.</p>
      </section>
    );
  }

  const saveDC = getSpellSaveDC(character);
  const attackBonus = getSpellAttackBonus(character);
  const slots = getSpellSlots(character);
  const circlesWithSlots = SPELL_CIRCLES.filter((circle) => slots[circle] > 0);

  return (
    <section className="sheet-section sheet-section--spellcasting" aria-label="Conjuração">
      <h2>Conjuração</h2>
      <div className="spellcasting-grid">
        <dl className="spellcasting-stats">
          <div>
            <dt>Atributo de Conjuração</dt>
            <dd>{ABILITY_NAMES[ability]}</dd>
          </div>
          <div>
            <dt>CD de Magia</dt>
            <dd>{saveDC && <ComputedField label="CD de Magia" computed={saveDC} onManualChange={setSpellSaveDCManualAdjustment} variant="value" />}</dd>
          </div>
          <div>
            <dt>Ataque Mágico</dt>
            <dd>
              {attackBonus && (
                <ComputedField label="Ataque Mágico" computed={attackBonus} onManualChange={setSpellAttackBonusManualAdjustment} />
              )}
            </dd>
          </div>
        </dl>

        <div className="spell-slots">
          {circlesWithSlots.length === 0 && <p className="empty-note">Nenhum espaço de magia neste nível.</p>}
          {circlesWithSlots.length > 0 && (
            <ul className="spell-slot-list">
              {circlesWithSlots.map((circle) => (
                <li key={circle} className="spell-slot-row">
                  <span className="spell-slot-row__circle">{circle}º</span>
                  <span className="spell-slot-row__total">{slots[circle]}</span>
                  <label className="spell-slot-row__expended">
                    <span>Gastos</span>
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
        </div>
      </div>
    </section>
  );
}
