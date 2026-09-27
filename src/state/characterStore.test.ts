import { beforeEach, describe, expect, it } from "vitest";
import { useCharacterStore } from "./characterStore.js";
import { getSkillProficiency } from "../rules/skills.js";

beforeEach(() => {
  useCharacterStore.getState().resetCharacter();
});

describe("useCharacterStore — inputs básicos", () => {
  it("armazena nível, classe e atributos como inputs simples", () => {
    const { setLevel, setClass, setAbilityScore } = useCharacterStore.getState();
    setLevel(5);
    setClass("mago");
    setAbilityScore("INT", 18);

    const { character } = useCharacterStore.getState();
    expect(character.level).toBe(5);
    expect(character.classId).toBe("mago");
    expect(character.abilities.INT.score).toBe(18);
  });

  it("cada personagem novo recebe um id anônimo diferente", () => {
    const firstId = useCharacterStore.getState().character.id;
    useCharacterStore.getState().resetCharacter();
    const secondId = useCharacterStore.getState().character.id;
    expect(firstId).not.toBe(secondId);
  });
});

describe("useCharacterStore — limpeza de escolhas inválidas (§4)", () => {
  it("Mago + Evocador → muda para Bárbaro → subclasse volta para vazio (nunca escolhe outra no lugar)", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setSubclass("Evocador");
    expect(useCharacterStore.getState().character.subclassId).toBe("Evocador");

    store.setClass("barbaro");
    expect(useCharacterStore.getState().character.subclassId).toBeNull();
  });

  it("mantém a subclasse se ela ainda existir na nova classe (não limpa à toa)", () => {
    // Cenário hipotético: trocar entre duas classes não deve limpar se o valor coincidir.
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setSubclass("Necromante");
    store.setClass("mago"); // "troca" para a mesma classe
    expect(useCharacterStore.getState().character.subclassId).toBe("Necromante");
  });

  it("classe define automaticamente as proficiências de armadura e limpa a armadura equipada se deixar de ser permitida", () => {
    const store = useCharacterStore.getState();
    store.setClass("guerreiro"); // proficiente em pesada
    store.setArmorEquipped("placas");
    expect(useCharacterStore.getState().character.armor.equipped).toBe("placas");

    store.setClass("mago"); // sem proficiência de armadura nenhuma
    const { character } = useCharacterStore.getState();
    expect(character.armor.proficiencies).toEqual({ light: false, medium: false, heavy: false, shield: false });
    expect(character.armor.equipped).toBe("unarmed");
  });

  it("desmarcar manualmente a proficiência de uma categoria de armadura também limpa a armadura equipada se ela deixar de ser válida", () => {
    const store = useCharacterStore.getState();
    store.setClass("guerreiro");
    store.setArmorEquipped("cotaDeMalha"); // pesada
    store.setArmorProficiency("heavy", false);
    expect(useCharacterStore.getState().character.armor.equipped).toBe("unarmed");
  });

  it("classe substitui totalmente as salvaguardas anteriores (única fonte possível sem multiclasse)", () => {
    const store = useCharacterStore.getState();
    store.setClass("barbaro"); // FOR, CON
    expect(useCharacterStore.getState().character.savingThrows.FOR.proficient).toBe(true);
    expect(useCharacterStore.getState().character.savingThrows.CON.proficient).toBe(true);

    store.setClass("mago"); // INT, SAB
    const { character } = useCharacterStore.getState();
    expect(character.savingThrows.FOR.proficient).toBe(false);
    expect(character.savingThrows.CON.proficient).toBe(false);
    expect(character.savingThrows.INT.proficient).toBe(true);
    expect(character.savingThrows.SAB.proficient).toBe(true);
  });

  it("mudar nível/classe/subclasse nunca deixa espaços gastos maiores que o total disponível", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setLevel(5); // 4/3/2/0... no total do 1º círculo
    store.setSpellSlotExpended(1, 4);
    expect(useCharacterStore.getState().character.spellcasting.slots[1].expended).toBe(4);

    store.setLevel(1); // 1º círculo cai para 2 espaços totais
    expect(useCharacterStore.getState().character.spellcasting.slots[1].expended).toBe(2);
  });
});

describe("useCharacterStore — antecedente (fontes de proficiência, §1.1)", () => {
  it("marca as 2 perícias do antecedente escolhido", () => {
    const store = useCharacterStore.getState();
    store.setBackground("sabio"); // Arcanismo, História
    const { character } = useCharacterStore.getState();
    expect(getSkillProficiency(character, "arcanismo")).toBe(true);
    expect(getSkillProficiency(character, "historia")).toBe(true);
  });

  it("trocar de antecedente REMOVE apenas as proficiências da fonte antiga", () => {
    const store = useCharacterStore.getState();
    store.setBackground("nobre"); // História, Persuasão
    store.setBackground("soldado"); // Atletismo, Intimidação
    const { character } = useCharacterStore.getState();

    expect(getSkillProficiency(character, "historia")).toBe(false);
    expect(getSkillProficiency(character, "persuasao")).toBe(false);
    expect(getSkillProficiency(character, "atletismo")).toBe(true);
    expect(getSkillProficiency(character, "intimidacao")).toBe(true);
  });

  it("uma proficiência marcada manualmente permanece após trocar de antecedente", () => {
    const store = useCharacterStore.getState();
    store.setBackground("nobre");
    store.setSkillManualOverride("furtividade", true); // nada a ver com o antecedente

    store.setBackground("soldado");
    store.setBackground("sabio");

    expect(getSkillProficiency(useCharacterStore.getState().character, "furtividade")).toBe(true);
  });

  it("perícia concedida por antecedente E marcada manualmente continua enquanto ao menos uma fonte existir", () => {
    const store = useCharacterStore.getState();
    store.setBackground("guarda"); // Atletismo, Percepção
    store.setSkillManualOverride("percepcao", true); // jogador também confirma manualmente

    store.setBackground("sabio"); // não concede mais Percepção — só a fonte "manual" resta

    expect(getSkillProficiency(useCharacterStore.getState().character, "percepcao")).toBe(true);
  });
});

describe("useCharacterStore — ajustes manuais nunca substituem o input automático", () => {
  it("guarda o ajuste manual de iniciativa separado do atributo", () => {
    const store = useCharacterStore.getState();
    store.setAbilityScore("DEX", 14);
    store.setInitiativeManualAdjustment(2);
    const { character } = useCharacterStore.getState();
    expect(character.abilities.DEX.score).toBe(14);
    expect(character.initiative.manualAdjustment).toBe(2);
  });
});
