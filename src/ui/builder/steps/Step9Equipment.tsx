import { useCharacterStore } from "../../../state/characterStore.js";
import { ArmorSection } from "../../sections/ArmorSection.js";

/** Etapa 9 — armadura/CA (reaproveita ArmorSection), ataques manuais e inventário. */
export function Step9Equipment() {
  const character = useCharacterStore((s) => s.character);
  const addAttack = useCharacterStore((s) => s.addAttack);
  const updateAttack = useCharacterStore((s) => s.updateAttack);
  const removeAttack = useCharacterStore((s) => s.removeAttack);
  const setInventoryEquipment = useCharacterStore((s) => s.setInventoryEquipment);
  const setCoin = useCharacterStore((s) => s.setCoin);
  const addAttunedItem = useCharacterStore((s) => s.addAttunedItem);
  const updateAttunedItem = useCharacterStore((s) => s.updateAttunedItem);
  const removeAttunedItem = useCharacterStore((s) => s.removeAttunedItem);

  return (
    <div className="builder-step" aria-label="Equipamento / Combate">
      <ArmorSection />

      <fieldset className="attack-list">
        <legend>Ataques</legend>
        {character.attacks.map((attack, index) => (
          <div className="attack-row" key={index}>
            <input
              type="text"
              placeholder="Nome"
              value={attack.name}
              onChange={(e) => updateAttack(index, { name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Bônus de ataque"
              value={attack.attackBonus}
              onChange={(e) => updateAttack(index, { attackBonus: e.target.value })}
            />
            <input type="text" placeholder="Dano" value={attack.damage} onChange={(e) => updateAttack(index, { damage: e.target.value })} />
            <input type="text" placeholder="Notas" value={attack.notes} onChange={(e) => updateAttack(index, { notes: e.target.value })} />
            <button type="button" onClick={() => removeAttack(index)} aria-label={`Remover ataque ${index + 1}`}>
              Remover
            </button>
          </div>
        ))}
        <button type="button" onClick={addAttack}>
          Adicionar ataque
        </button>
      </fieldset>

      <fieldset className="inventory">
        <legend>Inventário</legend>
        <label className="field">
          <span>Equipamento</span>
          <textarea value={character.inventory.equipment} onChange={(e) => setInventoryEquipment(e.target.value)} />
        </label>

        <div className="coin-row">
          {(["cp", "sp", "gp", "pp"] as const).map((coin) => (
            <label className="field field--coin" key={coin}>
              <span>{coin.toUpperCase()}</span>
              <input
                type="number"
                min={0}
                value={character.inventory.coins[coin]}
                onChange={(e) => setCoin(coin, Math.max(0, Number(e.target.value)))}
              />
            </label>
          ))}
        </div>

        <fieldset className="attuned-items">
          <legend>Itens Sintonizados</legend>
          {character.inventory.attunedItems.map((item, index) => (
            <div className="attuned-item-row" key={index}>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={item.attuned}
                  onChange={(e) => updateAttunedItem(index, { attuned: e.target.checked })}
                />
                <span>Sintonizado</span>
              </label>
              <input
                type="text"
                placeholder="Descrição"
                value={item.description}
                onChange={(e) => updateAttunedItem(index, { description: e.target.value })}
              />
              <button type="button" onClick={() => removeAttunedItem(index)} aria-label={`Remover item ${index + 1}`}>
                Remover
              </button>
            </div>
          ))}
          <button type="button" onClick={addAttunedItem}>
            Adicionar item sintonizado
          </button>
        </fieldset>
      </fieldset>
    </div>
  );
}
