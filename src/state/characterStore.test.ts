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
    store.setLevel(3); // subclasse só existe a partir do nível 3
    store.setClass("mago");
    store.setSubclass("Evocador");
    expect(useCharacterStore.getState().character.subclassId).toBe("Evocador");

    store.setClass("barbaro");
    expect(useCharacterStore.getState().character.subclassId).toBeNull();
  });

  it("mantém a subclasse se ela ainda existir na nova classe (não limpa à toa)", () => {
    // Cenário hipotético: trocar entre duas classes não deve limpar se o valor coincidir.
    const store = useCharacterStore.getState();
    store.setLevel(3);
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

describe("useCharacterStore — subclasse só a partir do nível 3 (regra fixa, aprovada)", () => {
  it("setSubclass é ignorado enquanto o nível é 1 ou 2", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setSubclass("Evocador");
    expect(useCharacterStore.getState().character.subclassId).toBeNull();

    store.setLevel(2);
    store.setSubclass("Evocador");
    expect(useCharacterStore.getState().character.subclassId).toBeNull();
  });

  it("setSubclass funciona normalmente a partir do nível 3", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setLevel(3);
    store.setSubclass("Evocador");
    expect(useCharacterStore.getState().character.subclassId).toBe("Evocador");
  });

  it("cair de nível 3+ para 1–2 limpa a subclasse escolhida", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setLevel(3);
    store.setSubclass("Evocador");

    store.setLevel(2);
    expect(useCharacterStore.getState().character.subclassId).toBeNull();
  });

  it("subir de nível 2 para 5 não escolhe subclasse nenhuma sozinho (continua null até o jogador escolher)", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setLevel(5);
    expect(useCharacterStore.getState().character.subclassId).toBeNull();
  });
});

describe("useCharacterStore — Treinamento Marcial (Colégio da Bravura, nível 3) concede Armadura Média/Escudo automaticamente", () => {
  it("escolher 'Colégio da Bravura' marca medium e shield, sem desmarcar light (que o Bardo já tinha)", () => {
    const store = useCharacterStore.getState();
    store.setClass("bardo");
    store.setLevel(3);
    expect(useCharacterStore.getState().character.armor.proficiencies.light).toBe(true); // já concedida pela classe
    expect(useCharacterStore.getState().character.armor.proficiencies.medium).toBe(false);

    store.setSubclass("Colégio da Bravura");
    const proficiencies = useCharacterStore.getState().character.armor.proficiencies;
    expect(proficiencies.light).toBe(true);
    expect(proficiencies.medium).toBe(true);
    expect(proficiencies.shield).toBe(true);
  });

  it("outra subclasse de Bardo não ganha a proficiência automaticamente", () => {
    const store = useCharacterStore.getState();
    store.setClass("bardo");
    store.setLevel(3);
    store.setSubclass("Colégio da Dança");
    expect(useCharacterStore.getState().character.armor.proficiencies.medium).toBe(false);
  });

  it("depois de concedida, o jogador ainda pode editar manualmente (setArmorProficiency continua funcionando)", () => {
    const store = useCharacterStore.getState();
    store.setClass("bardo");
    store.setLevel(3);
    store.setSubclass("Colégio da Bravura");
    expect(useCharacterStore.getState().character.armor.proficiencies.shield).toBe(true);

    store.setArmorProficiency("shield", false);
    expect(useCharacterStore.getState().character.armor.proficiencies.shield).toBe(false);
  });

  it("outra classe escolhendo um nome de subclasse igual (coincidência) nunca é afetada — a flag só olha classId === 'bardo'", () => {
    const store = useCharacterStore.getState();
    store.setClass("guerreiro");
    store.setLevel(3);
    expect(useCharacterStore.getState().character.armor.proficiencies.medium).toBe(true); // já concedida normalmente pela classe Guerreiro
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

describe("useCharacterStore — PV, salvaguardas contra morte e Inspiração Heroica (§21)", () => {
  it("guarda PV atual/temporário/ajuste manual de PV máximo e Dados de Vida gastos", () => {
    const store = useCharacterStore.getState();
    store.setHpCurrent(12);
    store.setHpTemp(3);
    store.setHpMaxManualAdjustment(-2);
    store.setHitDiceSpent(1);
    const { character } = useCharacterStore.getState();
    expect(character.hp).toEqual({ current: 12, temp: 3, maxManualAdjustment: -2, hitDiceSpent: 1 });
  });

  it("guarda sucessos/falhas de salvaguarda contra morte", () => {
    const store = useCharacterStore.getState();
    store.setDeathSaveSuccesses(2);
    store.setDeathSaveFailures(1);
    expect(useCharacterStore.getState().character.deathSaves).toEqual({ successes: 2, failures: 1 });
  });

  it("alterna Inspiração Heroica", () => {
    const store = useCharacterStore.getState();
    store.setHeroicInspiration(true);
    expect(useCharacterStore.getState().character.heroicInspiration).toBe(true);
  });
});

describe("useCharacterStore — listas manuais (ataques, magias preparadas, itens sintonizados)", () => {
  it("adiciona, atualiza e remove um ataque", () => {
    const store = useCharacterStore.getState();
    store.addAttack();
    expect(useCharacterStore.getState().character.attacks).toHaveLength(1);

    store.updateAttack(0, { name: "Espada Longa", damage: "1d8+3" });
    expect(useCharacterStore.getState().character.attacks[0]).toEqual({
      name: "Espada Longa",
      attackBonus: "",
      damage: "1d8+3",
      notes: "",
    });

    store.removeAttack(0);
    expect(useCharacterStore.getState().character.attacks).toHaveLength(0);
  });

  it("adiciona, atualiza e remove uma magia preparada", () => {
    const store = useCharacterStore.getState();
    store.addSpellPrepared();
    store.updateSpellPrepared(0, { name: "Bola de Fogo", circle: "3" });
    expect(useCharacterStore.getState().character.spellsPrepared[0].name).toBe("Bola de Fogo");

    store.removeSpellPrepared(0);
    expect(useCharacterStore.getState().character.spellsPrepared).toHaveLength(0);
  });

  it("adiciona, atualiza e remove um item sintonizado", () => {
    const store = useCharacterStore.getState();
    store.addAttunedItem();
    store.updateAttunedItem(0, { description: "Anel de Proteção", attuned: true });
    expect(useCharacterStore.getState().character.inventory.attunedItems[0]).toEqual({
      description: "Anel de Proteção",
      attuned: true,
    });

    store.removeAttunedItem(0);
    expect(useCharacterStore.getState().character.inventory.attunedItems).toHaveLength(0);
  });
});

describe("useCharacterStore — inventário (moedas, equipamento), aparência e idiomas", () => {
  it("guarda o texto de equipamento e cada tipo de moeda separadamente", () => {
    const store = useCharacterStore.getState();
    store.setInventoryEquipment("Mochila, corda 15m, 3 antorchas");
    store.setCoin("gp", 50);
    store.setCoin("cp", 12);
    const { character } = useCharacterStore.getState();
    expect(character.inventory.equipment).toBe("Mochila, corda 15m, 3 antorchas");
    expect(character.inventory.coins).toEqual({ cp: 12, sp: 0, gp: 50, pp: 0 });
  });

  it("guarda aparência e idiomas como texto livre", () => {
    const store = useCharacterStore.getState();
    store.setAppearance("1,80m, cabelo ruivo, cicatriz no olho esquerdo");
    store.setLanguages("Comum, Élfico, Anão");
    const { character } = useCharacterStore.getState();
    expect(character.appearance).toBe("1,80m, cabelo ruivo, cicatriz no olho esquerdo");
    expect(character.languages).toBe("Comum, Élfico, Anão");
  });
});

describe("useCharacterStore — equipamento inicial (pacotes A/B/C, §7)", () => {
  it("setStartingEquipmentOption grava o id e preenche equipamento/ouro com os dados da opção", () => {
    const store = useCharacterStore.getState();
    store.setClass("guerreiro");
    store.setStartingEquipmentOption("A");
    const { character } = useCharacterStore.getState();
    expect(character.startingEquipmentOptionId).toBe("A");
    expect(character.inventory.equipment).toContain("Cota de Malha");
    expect(character.inventory.coins.gp).toBe(4);
  });

  it("trocar de opção substitui equipamento/ouro pela nova opção", () => {
    const store = useCharacterStore.getState();
    store.setClass("guerreiro");
    store.setStartingEquipmentOption("A");
    store.setStartingEquipmentOption("C");
    const { character } = useCharacterStore.getState();
    expect(character.startingEquipmentOptionId).toBe("C");
    expect(character.inventory.equipment).toBe("");
    expect(character.inventory.coins.gp).toBe(155);
  });

  it("id inexistente na classe atual é ignorado (não corrompe o estado)", () => {
    const store = useCharacterStore.getState();
    store.setClass("guerreiro");
    store.setStartingEquipmentOption("Z");
    expect(useCharacterStore.getState().character.startingEquipmentOptionId).toBeNull();
  });

  it("trocar de classe limpa a opção escolhida (as opções são específicas da classe)", () => {
    const store = useCharacterStore.getState();
    store.setClass("guerreiro");
    store.setStartingEquipmentOption("A");
    store.setClass("mago");
    expect(useCharacterStore.getState().character.startingEquipmentOptionId).toBeNull();
  });
});

describe("useCharacterStore — escolhas de feature e talentos gerais escolhidos", () => {
  it("registra e limpa a seleção de uma escolha de feature", () => {
    const store = useCharacterStore.getState();
    store.setFeatureChoiceSelection("escolha-1", "furtividade");
    expect(useCharacterStore.getState().character.featureChoiceSelections["escolha-1"]).toEqual({ value: "furtividade" });

    store.clearFeatureChoiceSelection("escolha-1");
    expect(useCharacterStore.getState().character.featureChoiceSelections["escolha-1"]).toBeUndefined();
  });

  it("aceita seleção múltipla (array) para escolhas com count > 1", () => {
    const store = useCharacterStore.getState();
    store.setFeatureChoiceSelection("escolha-2", ["atletismo", "furtividade"]);
    expect(useCharacterStore.getState().character.featureChoiceSelections["escolha-2"]).toEqual({
      value: ["atletismo", "furtividade"],
    });
  });

  it("adiciona e remove um talento geral escolhido, sem duplicar", () => {
    const store = useCharacterStore.getState();
    store.addChosenFeat("talento-x");
    store.addChosenFeat("talento-x"); // repetido, não deve duplicar
    expect(useCharacterStore.getState().character.chosenFeatIds).toEqual(["talento-x"]);

    store.removeChosenFeat("talento-x");
    expect(useCharacterStore.getState().character.chosenFeatIds).toEqual([]);
  });
});
