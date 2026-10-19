import { classes } from "../data/classes.js";
import type { Character } from "../domain/character.js";
import { isConfirmationStillValid } from "../services/buildConfirmation.js";
import { isBlankCharacter } from "../services/characterRoster.js";
import { useBuilderStore } from "../state/builderStore.js";
import { useCharacterStore } from "../state/characterStore.js";

function describeCharacter(character: Character, confirmed: boolean): string {
  if (isBlankCharacter(character)) return "Novo personagem (em branco)";
  const name = character.name.trim() || "Sem nome";
  const classLabel = character.classId ? `${classes[character.classId].name} nível ${character.level}` : "sem classe";
  return `${name} — ${classLabel}${confirmed ? " · confirmado" : ""}`;
}

/**
 * "Meus personagens" (fonte "CONFIRMAR PERSONAGENS SEM ALTERAR OS
 * ANTERIORES"): trocar entre os personagens salvos neste navegador,
 * começar um novo ou excluir um daqui. Nada disso altera versões já
 * confirmadas nas estatísticas da comunidade. Trocar de personagem volta
 * o Builder à primeira etapa e descarta o rascunho de atributos ainda
 * não aplicado (ele pertencia ao personagem anterior).
 */
export function CharacterRoster() {
  const character = useCharacterStore((s) => s.character);
  const confirmedBuildSnapshot = useCharacterStore((s) => s.confirmedBuildSnapshot);
  const otherCharacters = useCharacterStore((s) => s.otherCharacters);
  const startNewCharacter = useCharacterStore((s) => s.startNewCharacter);
  const openCharacter = useCharacterStore((s) => s.openCharacter);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);

  const resetBuilder = () => useBuilderStore.setState({ currentStepId: "basicInfo", draftScores: {} });
  const activeLabel = describeCharacter(character, isConfirmationStillValid(character, confirmedBuildSnapshot));

  function handleDelete() {
    const message = `Excluir "${activeLabel}" deste navegador? Versões já confirmadas continuam nas estatísticas da comunidade.`;
    if (typeof window !== "undefined" && !window.confirm(message)) return;
    deleteCharacter(character.id);
    resetBuilder();
  }

  return (
    <section className="character-roster" aria-label="Meus personagens">
      <label className="character-roster__picker">
        <span>Meus personagens</span>
        <select
          value={character.id}
          onChange={(e) => {
            openCharacter(e.target.value);
            resetBuilder();
          }}
        >
          <option value={character.id}>{activeLabel}</option>
          {otherCharacters.map((entry) => (
            <option key={entry.character.id} value={entry.character.id}>
              {describeCharacter(entry.character, isConfirmationStillValid(entry.character, entry.confirmedBuildSnapshot))}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => {
          startNewCharacter();
          resetBuilder();
        }}
        disabled={isBlankCharacter(character)}
      >
        Novo personagem
      </button>
      <button type="button" onClick={handleDelete} disabled={isBlankCharacter(character) && otherCharacters.length === 0}>
        Excluir
      </button>
      <p className="character-roster__note">Salvos só neste navegador (não ficam na janela anônima).</p>
    </section>
  );
}
