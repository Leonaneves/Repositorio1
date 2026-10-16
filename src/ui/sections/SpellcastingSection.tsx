import { useCharacterStore } from "../../state/characterStore.js";
import type { WizardSpellbookEntry, WizardSpellbookOrigin } from "../../domain/character.js";
import { SPELL_CIRCLES } from "../../domain/ids.js";
import { getSpellAttackBonus, getSpellcastingAbility, getSpellSaveDC, getSpellSlots } from "../../rules/spellcasting.js";
import { getClassProgression } from "../../rules/classProgression.js";
import { getAutoPreparedSpells } from "../../rules/effectiveSpellsPrepared.js";
import { getWizardSpellbookClassGrantCount, getWizardVersadoGrantCount } from "../../rules/classResources.js";
import {
  getStaleVersadoSpellbookIndices,
  getWizardClassProgressionSpellbookCount,
  getWizardMaxEligibleCircle,
  getWizardPreparedCount,
  getWizardVersadoSpellbookCount,
} from "../../rules/wizardSpellbook.js";
import { ComputedField } from "../components/ComputedField.js";

const WIZARD_SPELLBOOK_ORIGIN_LABELS: Record<WizardSpellbookOrigin, string> = {
  classProgression: "Progressão da classe",
  subclassVersado: "Versado (subclasse)",
  other: "Outra origem",
};

/**
 * Livro de Magias do Mago (fonte "IMPLEMENTAR MAGO E SUAS SUBCLASSES
 * NO BUILDER E NO PDF" §3) — SUBSTITUI a lista genérica "Magias
 * Preparadas Manualmente" para esta classe (rules/effectiveSpellsPrepared.ts
 * já lê daqui, nunca das duas ao mesmo tempo). Distingue "estar no
 * livro" (toda a lista) de "estar preparada" (`entry.prepared`) —
 * Maestria de Magias/Assinatura Mágica são flags próprias, sempre
 * preparadas independentemente de `prepared`.
 */
function WizardSpellbook() {
  const character = useCharacterStore((s) => s.character);
  const addEntry = useCharacterStore((s) => s.addWizardSpellbookEntry);
  const updateEntry = useCharacterStore((s) => s.updateWizardSpellbookEntry);
  const removeEntry = useCharacterStore((s) => s.removeWizardSpellbookEntry);

  const classGrant = getWizardSpellbookClassGrantCount(character);
  const classCount = getWizardClassProgressionSpellbookCount(character);
  const versadoGrant = getWizardVersadoGrantCount(character);
  const versadoCount = getWizardVersadoSpellbookCount(character);
  const preparedCount = getWizardPreparedCount(character);
  const preparedMax = getClassProgression(character).spellsPreparedMax;
  const maxEligibleCircle = getWizardMaxEligibleCircle(character) ?? 1;
  const staleIndices = new Set(getStaleVersadoSpellbookIndices(character));

  function patch(index: number, fields: Partial<WizardSpellbookEntry>) {
    updateEntry(index, fields);
  }

  return (
    <div className="spells-prepared">
      <h3>Livro de Magias</h3>
      <p className="builder-step__hint">
        Concedidas pela classe: {classCount}/{classGrant ?? 0} — Concedidas por Versado: {versadoCount}/{versadoGrant ?? 0} — Preparadas:{" "}
        {preparedCount}/{preparedMax ?? 0}
      </p>
      {staleIndices.size > 0 && (
        <p className="builder-step__hint">
          ⚠ {staleIndices.size} magia(s) de Versado concedida(s) sob outra subclasse — revise manualmente (nada é apagado automaticamente).
        </p>
      )}
      {character.wizardSpellbook.length === 0 && <p className="empty-note">Nenhuma magia no livro ainda.</p>}
      {character.wizardSpellbook.map((entry, index) => (
        <div className={`attack-row${staleIndices.has(index) ? " review-block--pending" : ""}`} key={index}>
          <input type="text" placeholder="Nome da magia" value={entry.name} onChange={(e) => patch(index, { name: e.target.value })} />
          <select value={entry.circle} onChange={(e) => patch(index, { circle: Number(e.target.value) as WizardSpellbookEntry["circle"] })}>
            {SPELL_CIRCLES.filter((circle) => circle <= Math.max(maxEligibleCircle, entry.circle)).map((circle) => (
              <option key={circle} value={circle}>
                {circle}º círculo
              </option>
            ))}
          </select>
          <select
            value={entry.origin}
            onChange={(e) =>
              patch(index, {
                origin: e.target.value as WizardSpellbookOrigin,
                grantedUnderSubclass: e.target.value === "subclassVersado" ? character.subclassId : null,
              })
            }
          >
            {(Object.keys(WIZARD_SPELLBOOK_ORIGIN_LABELS) as WizardSpellbookOrigin[]).map((origin) => (
              <option key={origin} value={origin}>
                {WIZARD_SPELLBOOK_ORIGIN_LABELS[origin]}
              </option>
            ))}
          </select>
          <label className="checkbox-field checkbox-field--compact">
            <input type="checkbox" checked={entry.prepared} onChange={(e) => patch(index, { prepared: e.target.checked })} />
            <span>Preparada</span>
          </label>
          {character.level >= 18 && (
            <label className="checkbox-field checkbox-field--compact">
              <input type="checkbox" checked={entry.isSpellMastery} onChange={(e) => patch(index, { isSpellMastery: e.target.checked })} />
              <span>Maestria de Magias</span>
            </label>
          )}
          {character.level >= 20 && (
            <label className="checkbox-field checkbox-field--compact">
              <input
                type="checkbox"
                checked={entry.isSignatureSpell}
                onChange={(e) => patch(index, { isSignatureSpell: e.target.checked })}
              />
              <span>Assinatura Mágica</span>
            </label>
          )}
          <button type="button" onClick={() => removeEntry(index)} aria-label={`Remover magia ${index + 1} do livro`}>
            Remover
          </button>
        </div>
      ))}
      <button type="button" onClick={addEntry}>
        Adicionar magia ao livro
      </button>
    </div>
  );
}

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
  const addSpellPrepared = useCharacterStore((s) => s.addSpellPrepared);
  const updateSpellPrepared = useCharacterStore((s) => s.updateSpellPrepared);
  const removeSpellPrepared = useCharacterStore((s) => s.removeSpellPrepared);

  const ability = getSpellcastingAbility(character);
  const autoPrepared = getAutoPreparedSpells(character);

  // §11: personagem sem nenhuma fonte de conjuração não precisa de uma
  // grande seção vazia — mantém uma área compacta e desativada, em vez
  // de ocultar por completo (a ficha original sempre reserva o espaço).
  // Mesmo sem conjuração de CLASSE, a espécie pode conceder magias por
  // Linhagem (Elfo/Gnomo/Tiefling — fonte "IMPLEMENTAR LINHAGENS..."
  // §3: "Isso também deve funcionar para personagem cuja classe não
  // tenha conjuração") — por isso a lista automática aparece mesmo aqui.
  if (!ability) {
    return (
      <section className="sheet-section sheet-section--spellcasting sheet-section--empty" aria-label="Conjuração">
        <h2>Conjuração</h2>
        {autoPrepared.length > 0 ? (
          <div className="spells-prepared">
            <h3>Magias Concedidas Automaticamente</h3>
            <ul className="review-feature-list">
              {autoPrepared.map((spell, i) => (
                <li key={i}>
                  <strong>{spell.name}</strong>
                  {spell.notes ? ` — ${spell.notes}` : ""}
                </li>
              ))}
            </ul>
            <p className="empty-note">Detalhes da magia (círculo, alcance etc.) aguardam o catálogo completo.</p>
          </div>
        ) : (
          <p className="empty-note">Este personagem não tem uma fonte de conjuração.</p>
        )}
      </section>
    );
  }

  const saveDC = getSpellSaveDC(character);
  const attackBonus = getSpellAttackBonus(character);
  const slots = getSpellSlots(character);
  const circlesWithSlots = SPELL_CIRCLES.filter((circle) => slots[circle] > 0);
  const progression = getClassProgression(character);

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
              {/* Só o total de espaços MÁXIMOS — "Gastos" é estado de sessão, fora do escopo da criação (§32-37). */}
              <ul className="spell-slot-list">
                {circlesWithSlots.map((circle) => (
                  <li key={circle} className="spell-slot-row">
                    <span className="spell-slot-row__circle">{circle}º</span>
                    <span className="spell-slot-row__total">{slots[circle]}</span>
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

        {character.classId !== "mago" && (
          <>
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
          </>
        )}
      </div>

      {character.classId === "mago" && <WizardSpellbook />}
    </section>
  );
}
