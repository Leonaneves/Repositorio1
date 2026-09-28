import { useCharacterStore } from "../../../state/characterStore.js";

/** Etapa 1 — nome do personagem e nível inicial de criação. */
export function Step1BasicInfo() {
  const character = useCharacterStore((s) => s.character);
  const setName = useCharacterStore((s) => s.setName);
  const setLevel = useCharacterStore((s) => s.setLevel);

  return (
    <div className="builder-step" aria-label="Informações Básicas">
      <label className="field">
        <span>Nome do personagem</span>
        <input type="text" value={character.name} placeholder="—" onChange={(e) => setName(e.target.value)} />
      </label>

      <label className="field">
        <span>Nível inicial</span>
        <input
          type="number"
          min={1}
          max={20}
          value={character.level}
          onChange={(e) => {
            const value = Number(e.target.value);
            if (value >= 1 && value <= 20) setLevel(value);
          }}
        />
      </label>
    </div>
  );
}
