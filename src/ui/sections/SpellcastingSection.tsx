import { useCharacterStore } from "../../state/characterStore.js";
import { SPELL_CIRCLES } from "../../domain/ids.js";
import { getSpellAttackBonus, getSpellcastingAbility, getSpellSaveDC, getSpellSlots } from "../../rules/spellcasting.js";
import { getClassProgression } from "../../rules/classProgression.js";
import { getAutoPreparedSpells } from "../../rules/effectiveSpellsPrepared.js";
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
  const addSpellPrepared = useCharacterStore((s) => s.addSpellPrepared);
  const updateSpellPrepared = useCharacterStore((s) => s.updateSpellPrepared);
  const removeSpellPrepared = useCharacterStore((s) => s.removeSpellPrepared);

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
  const progression = getClassProgression(character);
  const autoPrepared = getAutoPreparedSpells(character);

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
          {progression.cantripsKnown !== null && (
            <div>
              <dt>Truques Conhecidos</dt>
              <dd>{progression.cantripsKnown}</dd>
            </div>
          )}
          {progression.spellsPreparedMax !== null && (
            <div>
              <dt>Magias Preparadas (máximo)</dt>
              <dd>{progression.spellsPreparedMax}</dd>
            </div>
          )}
        </dl>

        <div className="spell-slots">
          {circlesWithSlots.length === 0 && <p className="empty-note">Nenhum espaço de magia neste nível.</p>}
          {circlesWithSlots.length > 0 && (
            <>
              {/* Magia de Pacto do Bruxo já entra no mesmo cálculo de `getSpellSlots` (concentrada num único círculo) — só o rótulo distingue, nunca uma tabela separada. */}
              {progression.pactMagic && <p className="builder-step__hint">Magia de Pacto — os espaços abaixo recuperam num Descanso Curto, não só Longo.</p>}
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
            </>
          )}
        </div>
      </div>

      <div className="spells-prepared">
        <h3>Magias Concedidas Automaticamente</h3>
        {autoPrepared.length === 0 ? (
          <p className="empty-note">Nenhuma magia concedida automaticamente por classe/subclasse neste nível.</p>
        ) : (
          <ul className="review-feature-list">
            {autoPrepared.map((spell, i) => (
              <li key={i}>
                <strong>{spell.name}</strong>
                {spell.circle ? ` (${spell.circle}º)` : ""}
                {spell.notes ? ` — ${spell.notes}` : ""}
              </li>
            ))}
          </ul>
        )}

        <h3>Magias Preparadas Manualmente</h3>
        <p className="empty-note">
          Catálogo completo de magias ainda pendente neste protótipo — preencha o nome manualmente abaixo.
        </p>
        {character.spellsPrepared.map((spell, index) => (
          <div className="attack-row" key={index}>
            <input
              type="text"
              placeholder="Círculo"
              value={spell.circle}
              onChange={(e) => updateSpellPrepared(index, { circle: e.target.value })}
            />
            <input
              type="text"
              placeholder="Nome da magia"
              value={spell.name}
              onChange={(e) => updateSpellPrepared(index, { name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Alcance"
              value={spell.range}
              onChange={(e) => updateSpellPrepared(index, { range: e.target.value })}
            />
            <input
              type="text"
              placeholder="Notas"
              value={spell.notes}
              onChange={(e) => updateSpellPrepared(index, { notes: e.target.value })}
            />
            <button type="button" onClick={() => removeSpellPrepared(index)} aria-label={`Remover magia ${index + 1}`}>
              Remover
            </button>
          </div>
        ))}
        <button type="button" onClick={addSpellPrepared}>
          Adicionar magia preparada
        </button>
      </div>
    </section>
  );
}
