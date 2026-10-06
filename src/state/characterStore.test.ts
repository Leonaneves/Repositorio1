import { beforeEach, describe, expect, it } from "vitest";
import { useCharacterStore } from "./characterStore.js";
import { getSkillProficiency } from "../rules/skills.js";
import { ORDEM_DIVINA_CHOICE_ID } from "../data/features/cleric.js";
import { ORDEM_PRIMAL_CHOICE_ID } from "../data/features/druid.js";
import { getWildShapeFormsConfig } from "../rules/wildShapeForms.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID, ELEMENTAL_AFFINITY_CHOICE_ID } from "../data/features/subclasses.js";
import { getClassToolChoiceId } from "../data/classes.js";
import { getEffectiveAbilityScore } from "../rules/abilities.js";

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

describe("useCharacterStore — Protetor (Ordem Divina do Clérigo, nível 1) concede Armadura Pesada automaticamente", () => {
  it("escolher 'Protetor' marca heavy, sem desmarcar light/medium/shield (que o Clérigo já tinha)", () => {
    const store = useCharacterStore.getState();
    store.setClass("clerigo");
    expect(useCharacterStore.getState().character.armor.proficiencies.light).toBe(true); // já concedida pela classe
    expect(useCharacterStore.getState().character.armor.proficiencies.heavy).toBe(false);

    store.setFeatureChoiceSelection(ORDEM_DIVINA_CHOICE_ID, "Protetor");
    const proficiencies = useCharacterStore.getState().character.armor.proficiencies;
    expect(proficiencies.light).toBe(true);
    expect(proficiencies.medium).toBe(true);
    expect(proficiencies.shield).toBe(true);
    expect(proficiencies.heavy).toBe(true);
  });

  it("escolher 'Taumaturgo' não concede Armadura Pesada", () => {
    const store = useCharacterStore.getState();
    store.setClass("clerigo");
    store.setFeatureChoiceSelection(ORDEM_DIVINA_CHOICE_ID, "Taumaturgo");
    expect(useCharacterStore.getState().character.armor.proficiencies.heavy).toBe(false);
  });

  it("outra classe nunca ganha a proficiência automaticamente mesmo com o mesmo id de escolha por acidente", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setFeatureChoiceSelection(ORDEM_DIVINA_CHOICE_ID, "Protetor");
    expect(useCharacterStore.getState().character.armor.proficiencies.heavy).toBe(false);
  });

  it("depois de concedida, o jogador ainda pode editar manualmente (setArmorProficiency continua funcionando)", () => {
    const store = useCharacterStore.getState();
    store.setClass("clerigo");
    store.setFeatureChoiceSelection(ORDEM_DIVINA_CHOICE_ID, "Protetor");
    expect(useCharacterStore.getState().character.armor.proficiencies.heavy).toBe(true);

    store.setArmorProficiency("heavy", false);
    expect(useCharacterStore.getState().character.armor.proficiencies.heavy).toBe(false);
  });
});

describe("useCharacterStore — Protetor (Ordem Primal do Druida, nível 1) concede Armadura Média automaticamente", () => {
  it("escolher 'Protetor' marca medium, sem desmarcar light/shield (que o Druida já tinha)", () => {
    const store = useCharacterStore.getState();
    store.setClass("druida");
    expect(useCharacterStore.getState().character.armor.proficiencies.light).toBe(true); // já concedida pela classe
    expect(useCharacterStore.getState().character.armor.proficiencies.medium).toBe(false);

    store.setFeatureChoiceSelection(ORDEM_PRIMAL_CHOICE_ID, "Protetor");
    const proficiencies = useCharacterStore.getState().character.armor.proficiencies;
    expect(proficiencies.light).toBe(true);
    expect(proficiencies.medium).toBe(true);
    expect(proficiencies.shield).toBe(true);
  });

  it("escolher 'Xamã' não concede Armadura Média", () => {
    const store = useCharacterStore.getState();
    store.setClass("druida");
    store.setFeatureChoiceSelection(ORDEM_PRIMAL_CHOICE_ID, "Xamã");
    expect(useCharacterStore.getState().character.armor.proficiencies.medium).toBe(false);
  });

  it("outra classe nunca ganha a proficiência automaticamente mesmo com o mesmo id de escolha por acidente", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setFeatureChoiceSelection(ORDEM_PRIMAL_CHOICE_ID, "Protetor");
    expect(useCharacterStore.getState().character.armor.proficiencies.medium).toBe(false);
  });

  it("depois de concedida, o jogador ainda pode editar manualmente", () => {
    const store = useCharacterStore.getState();
    store.setClass("druida");
    store.setFeatureChoiceSelection(ORDEM_PRIMAL_CHOICE_ID, "Protetor");
    expect(useCharacterStore.getState().character.armor.proficiencies.medium).toBe(true);

    store.setArmorProficiency("medium", false);
    expect(useCharacterStore.getState().character.armor.proficiencies.medium).toBe(false);
  });
});

describe("useCharacterStore — Formas Conhecidas de Forma Selvagem (Druida)", () => {
  it("addKnownWildShapeForm adiciona uma entrada em branco", () => {
    const store = useCharacterStore.getState();
    store.setClass("druida");
    store.addKnownWildShapeForm();
    expect(useCharacterStore.getState().character.knownWildShapeForms).toEqual([{ name: "", challengeRating: "", hasFlySpeed: false }]);
  });

  it("updateKnownWildShapeForm atualiza só a entrada do índice informado", () => {
    const store = useCharacterStore.getState();
    store.setClass("druida");
    store.addKnownWildShapeForm();
    store.addKnownWildShapeForm();
    store.updateKnownWildShapeForm(1, { name: "Lobo", challengeRating: "1/4" });
    const forms = useCharacterStore.getState().character.knownWildShapeForms;
    expect(forms[0]).toEqual({ name: "", challengeRating: "", hasFlySpeed: false });
    expect(forms[1]).toEqual({ name: "Lobo", challengeRating: "1/4", hasFlySpeed: false });
  });

  it("removeKnownWildShapeForm remove só a entrada do índice informado", () => {
    const store = useCharacterStore.getState();
    store.setClass("druida");
    store.addKnownWildShapeForm();
    store.updateKnownWildShapeForm(0, { name: "Lobo" });
    store.addKnownWildShapeForm();
    store.updateKnownWildShapeForm(1, { name: "Urso" });
    store.removeKnownWildShapeForm(0);
    expect(useCharacterStore.getState().character.knownWildShapeForms).toEqual([{ name: "Urso", challengeRating: "", hasFlySpeed: false }]);
  });

  it("trocar de classe para fora de Druida limpa as Formas Conhecidas, igual às Invocações Místicas do Bruxo", () => {
    const store = useCharacterStore.getState();
    store.setClass("druida");
    store.addKnownWildShapeForm();
    store.updateKnownWildShapeForm(0, { name: "Lobo" });
    expect(useCharacterStore.getState().character.knownWildShapeForms).toHaveLength(1);

    store.setClass("mago");
    expect(useCharacterStore.getState().character.knownWildShapeForms).toEqual([]);
  });

  it("a configuração de contagem/ND/Voo por nível é a mesma usada pelo motor de regras (nunca duplicada)", () => {
    const store = useCharacterStore.getState();
    store.setClass("druida");
    store.setLevel(8);
    expect(getWildShapeFormsConfig(useCharacterStore.getState().character.level)).toEqual({ count: 8, maxChallengeRating: 1, flyAllowed: true });
  });
});

describe("useCharacterStore — Metamagia (Feiticeiro)", () => {
  it("addMetamagicOption adiciona 1 opção, sem duplicar", () => {
    const store = useCharacterStore.getState();
    store.setClass("feiticeiro");
    store.addMetamagicOption("sutil");
    store.addMetamagicOption("sutil");
    expect(useCharacterStore.getState().character.knownMetamagicOptions).toEqual(["sutil"]);
  });

  it("removeMetamagicOption remove só a opção informada", () => {
    const store = useCharacterStore.getState();
    store.setClass("feiticeiro");
    store.addMetamagicOption("sutil");
    store.addMetamagicOption("distante");
    store.removeMetamagicOption("sutil");
    expect(useCharacterStore.getState().character.knownMetamagicOptions).toEqual(["distante"]);
  });

  it("trocar de classe para fora de Feiticeiro limpa as opções conhecidas, igual às Invocações Místicas do Bruxo", () => {
    const store = useCharacterStore.getState();
    store.setClass("feiticeiro");
    store.addMetamagicOption("sutil");
    expect(useCharacterStore.getState().character.knownMetamagicOptions).toHaveLength(1);

    store.setClass("mago");
    expect(useCharacterStore.getState().character.knownMetamagicOptions).toEqual([]);
  });
});

describe("useCharacterStore — Terreno do Círculo da Terra / Afinidade Elemental são limpos ao trocar de subclasse/classe/nível (CONSOLIDAÇÃO DO BUILDER §10/§11)", () => {
  it("trocar de 'Círculo da Terra' para outra subclasse de Druida limpa o Terreno escolhido", () => {
    const store = useCharacterStore.getState();
    store.setClass("druida");
    store.setLevel(3);
    store.setSubclass("Círculo da Terra");
    store.setFeatureChoiceSelection(EARTH_CIRCLE_TERRAIN_CHOICE_ID, "Tropical");
    expect(useCharacterStore.getState().character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID]?.value).toBe("Tropical");

    store.setSubclass("Círculo da Lua");
    expect(useCharacterStore.getState().character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID]).toBeUndefined();
  });

  it("baixar o nível abaixo de 3 (limpando a subclasse) também limpa o Terreno escolhido", () => {
    const store = useCharacterStore.getState();
    store.setClass("druida");
    store.setLevel(3);
    store.setSubclass("Círculo da Terra");
    store.setFeatureChoiceSelection(EARTH_CIRCLE_TERRAIN_CHOICE_ID, "Árido");

    store.setLevel(2);
    expect(useCharacterStore.getState().character.subclassId).toBeNull();
    expect(useCharacterStore.getState().character.featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID]).toBeUndefined();
  });

  it("trocar de classe para fora de Feiticeiro limpa a Afinidade Elemental escolhida", () => {
    const store = useCharacterStore.getState();
    store.setClass("feiticeiro");
    store.setLevel(6);
    store.setSubclass("Feitiçaria Dracônica");
    store.setFeatureChoiceSelection(ELEMENTAL_AFFINITY_CHOICE_ID, "Fogo");
    expect(useCharacterStore.getState().character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID]?.value).toBe("Fogo");

    store.setClass("mago");
    expect(useCharacterStore.getState().character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID]).toBeUndefined();
  });

  it("trocar de 'Feitiçaria Dracônica' para outra subclasse de Feiticeiro limpa a Afinidade Elemental escolhida", () => {
    const store = useCharacterStore.getState();
    store.setClass("feiticeiro");
    store.setLevel(6);
    store.setSubclass("Feitiçaria Dracônica");
    store.setFeatureChoiceSelection(ELEMENTAL_AFFINITY_CHOICE_ID, "Gelo");

    store.setSubclass("Feitiçaria Selvagem");
    expect(useCharacterStore.getState().character.featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID]).toBeUndefined();
  });

  it("não toca em outras featureChoiceSelections independentes ao limpar (§10: nunca apagar informação independente)", () => {
    const store = useCharacterStore.getState();
    store.setClass("druida");
    store.setLevel(3);
    store.setSubclass("Círculo da Terra");
    store.setFeatureChoiceSelection(EARTH_CIRCLE_TERRAIN_CHOICE_ID, "Polar");
    store.setFeatureChoiceSelection(ORDEM_PRIMAL_CHOICE_ID, "Xamã");

    store.setSubclass("Círculo da Lua");
    expect(useCharacterStore.getState().character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID]?.value).toBe("Xamã");
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

describe("useCharacterStore — Linhagem/Ancestralidade de espécie (fonte \"IMPLEMENTAR LINHAGENS...\" §2)", () => {
  it("setSpecies limpa a Linhagem/atributo élfico ao trocar de espécie de fato", () => {
    const store = useCharacterStore.getState();
    store.setSpecies("elfo");
    store.setSpeciesLineage("elfo-drow");
    store.setElvenLineageSpellcastingAbility("CAR");

    store.setSpecies("tiefling");
    const character = useCharacterStore.getState().character;
    expect(character.speciesLineageId).toBeNull();
    expect(character.elvenLineageSpellcastingAbility).toBeNull();
  });

  it("setSpecies com o MESMO valor não apaga a linhagem já escolhida (nenhuma mudança real de espécie)", () => {
    const store = useCharacterStore.getState();
    store.setSpecies("draconato");
    store.setSpeciesLineage("draconato-vermelho");

    store.setSpecies("draconato");
    expect(useCharacterStore.getState().character.speciesLineageId).toBe("draconato-vermelho");
  });

  it("setSpeciesLineage/setElvenLineageSpellcastingAbility gravam o valor escolhido e aceitam null", () => {
    const store = useCharacterStore.getState();
    store.setSpecies("elfo");
    store.setSpeciesLineage("elfo-alto-elfo");
    store.setElvenLineageSpellcastingAbility("INT");
    expect(useCharacterStore.getState().character.speciesLineageId).toBe("elfo-alto-elfo");
    expect(useCharacterStore.getState().character.elvenLineageSpellcastingAbility).toBe("INT");

    store.setSpeciesLineage(null);
    store.setElvenLineageSpellcastingAbility(null);
    expect(useCharacterStore.getState().character.speciesLineageId).toBeNull();
    expect(useCharacterStore.getState().character.elvenLineageSpellcastingAbility).toBeNull();
  });

  it("trocar de Linhagem Élfica (dentro do Elfo) preserva o atributo já escolhido — não é 'troca de origem'", () => {
    const store = useCharacterStore.getState();
    store.setSpecies("elfo");
    store.setSpeciesLineage("elfo-alto-elfo");
    store.setElvenLineageSpellcastingAbility("SAB");

    store.setSpeciesLineage("elfo-floresta");
    expect(useCharacterStore.getState().character.elvenLineageSpellcastingAbility).toBe("SAB");
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

describe("useCharacterStore — Invocações Místicas do Bruxo (addInvocation/removeInvocation/setInvocationSubChoice)", () => {
  it("adiciona 1 cópia com subChoice vazio", () => {
    const store = useCharacterStore.getState();
    store.setClass("bruxo");
    store.addInvocation("mente-mistica");
    expect(useCharacterStore.getState().character.chosenInvocations).toEqual([{ invocationId: "mente-mistica", subChoice: "" }]);
  });

  it("permite adicionar a MESMA invocação mais de uma vez (repetíveis — a validação de duplicata fica em rules/invocations.ts)", () => {
    const store = useCharacterStore.getState();
    store.setClass("bruxo");
    store.addInvocation("explosao-agonizante");
    store.addInvocation("explosao-agonizante");
    expect(useCharacterStore.getState().character.chosenInvocations).toHaveLength(2);
  });

  it("setInvocationSubChoice edita só a cópia do índice indicado", () => {
    const store = useCharacterStore.getState();
    store.setClass("bruxo");
    store.addInvocation("explosao-agonizante");
    store.addInvocation("explosao-agonizante");
    store.setInvocationSubChoice(0, "Raio de Fogo");
    store.setInvocationSubChoice(1, "Mãos Flamejantes");
    const chosen = useCharacterStore.getState().character.chosenInvocations;
    expect(chosen[0].subChoice).toBe("Raio de Fogo");
    expect(chosen[1].subChoice).toBe("Mãos Flamejantes");
  });

  it("removeInvocation remove só o índice indicado, preservando a ordem das demais", () => {
    const store = useCharacterStore.getState();
    store.setClass("bruxo");
    store.addInvocation("mente-mistica");
    store.addInvocation("pacto-da-lamina");
    store.addInvocation("visao-diabolica");
    store.removeInvocation(1);
    expect(useCharacterStore.getState().character.chosenInvocations.map((c) => c.invocationId)).toEqual(["mente-mistica", "visao-diabolica"]);
  });

  it("trocar de classe (Bruxo → outra) limpa as invocações escolhidas", () => {
    const store = useCharacterStore.getState();
    store.setClass("bruxo");
    store.addInvocation("mente-mistica");
    expect(useCharacterStore.getState().character.chosenInvocations).toHaveLength(1);

    store.setClass("mago");
    expect(useCharacterStore.getState().character.chosenInvocations).toEqual([]);
  });

  it("trocar entre classes não-Bruxo nunca cria invocações (continua [])", () => {
    const store = useCharacterStore.getState();
    store.setClass("guerreiro");
    store.setClass("mago");
    expect(useCharacterStore.getState().character.chosenInvocations).toEqual([]);
  });
});

describe("useCharacterStore — Aumentos de Atributo do Antecedente (REORGANIZAÇÃO DO BUILDER §12/§19/§39)", () => {
  it("increase/decreaseBackgroundAbilityBonus respeitam o pool (3 pontos) e o máximo (+2) do Antecedente atual", () => {
    const store = useCharacterStore.getState();
    store.setBackground("acolito"); // INT, SAB, CAR
    store.increaseBackgroundAbilityBonus("INT");
    store.increaseBackgroundAbilityBonus("INT");
    expect(useCharacterStore.getState().character.backgroundAbilityBonuses.INT).toBe(2);

    store.increaseBackgroundAbilityBonus("INT"); // já no máximo — sem efeito
    expect(useCharacterStore.getState().character.backgroundAbilityBonuses.INT).toBe(2);

    store.increaseBackgroundAbilityBonus("SAB");
    expect(useCharacterStore.getState().character.backgroundAbilityBonuses).toEqual({ INT: 2, SAB: 1 });

    store.decreaseBackgroundAbilityBonus("INT");
    expect(useCharacterStore.getState().character.backgroundAbilityBonuses.INT).toBe(1);
  });

  it("nunca permite distribuir numa habilidade fora das 3 elegíveis do Antecedente", () => {
    const store = useCharacterStore.getState();
    store.setBackground("acolito"); // INT, SAB, CAR — nunca FOR
    store.increaseBackgroundAbilityBonus("FOR");
    expect(useCharacterStore.getState().character.backgroundAbilityBonuses.FOR).toBeUndefined();
  });

  it("trocar de Antecedente nunca acumula o bônus antigo com o novo — sempre limpa para {}", () => {
    const store = useCharacterStore.getState();
    store.setBackground("acolito");
    store.increaseBackgroundAbilityBonus("INT");
    store.increaseBackgroundAbilityBonus("INT");
    expect(useCharacterStore.getState().character.backgroundAbilityBonuses.INT).toBe(2);

    store.setBackground("soldado"); // FOR, DEX, CON
    expect(useCharacterStore.getState().character.backgroundAbilityBonuses).toEqual({});
  });

  it("o bônus do Antecedente afeta getEffectiveAbilityScore", () => {
    const store = useCharacterStore.getState();
    store.setBackground("acolito");
    store.setAbilityScore("INT", 10);
    store.increaseBackgroundAbilityBonus("INT");
    expect(getEffectiveAbilityScore(useCharacterStore.getState().character, "INT")).toBe(11);
  });
});

describe("useCharacterStore — ASI estruturado (REORGANIZAÇÃO DO BUILDER §22-§29, §38, §40)", () => {
  it("setAsiMode('abilityIncrease') + increase/decreaseAsiAbility respeitam 2 pontos totais, máximo +2", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setLevel(4);
    store.setAsiMode(4, "abilityIncrease");
    store.increaseAsiAbility(4, "FOR");
    store.increaseAsiAbility(4, "FOR");
    expect(useCharacterStore.getState().character.asiSelections[4]).toEqual({ kind: "abilityIncrease", allocations: { FOR: 2 } });

    store.increaseAsiAbility(4, "DEX"); // pool já em 0 — sem efeito
    expect(useCharacterStore.getState().character.asiSelections[4]).toEqual({ kind: "abilityIncrease", allocations: { FOR: 2 } });

    store.decreaseAsiAbility(4, "FOR");
    store.increaseAsiAbility(4, "DEX");
    expect(useCharacterStore.getState().character.asiSelections[4]).toEqual({ kind: "abilityIncrease", allocations: { FOR: 1, DEX: 1 } });
  });

  it("trocar para 'feat' remove o bônus de atributo do ASI anterior (nunca deixa bônus ocultos)", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setLevel(4);
    store.setAsiMode(4, "abilityIncrease");
    store.increaseAsiAbility(4, "FOR");
    store.increaseAsiAbility(4, "FOR");

    store.setAsiMode(4, "feat");
    expect(useCharacterStore.getState().character.asiSelections[4]).toEqual({ kind: "feat" });
  });

  it("voltar para 'abilityIncrease' começa do zero, nunca duplica bônus antigo", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setLevel(4);
    store.setAsiMode(4, "abilityIncrease");
    store.increaseAsiAbility(4, "FOR");
    store.increaseAsiAbility(4, "FOR");
    store.setAsiMode(4, "feat");
    store.setAsiMode(4, "abilityIncrease");
    expect(useCharacterStore.getState().character.asiSelections[4]).toEqual({ kind: "abilityIncrease", allocations: {} });
  });

  it("cada nível de ASI é independente — alterar o nível 8 nunca afeta o nível 4", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setLevel(8);
    store.setAsiMode(4, "abilityIncrease");
    store.increaseAsiAbility(4, "FOR");
    store.increaseAsiAbility(4, "FOR");
    store.setAsiMode(8, "abilityIncrease");
    store.increaseAsiAbility(8, "DEX");

    const { asiSelections } = useCharacterStore.getState().character;
    expect(asiSelections[4]).toEqual({ kind: "abilityIncrease", allocations: { FOR: 2 } });
    expect(asiSelections[8]).toEqual({ kind: "abilityIncrease", allocations: { DEX: 1 } });
  });

  it("trocar de classe remove os ASIs de níveis que a nova classe não concede (§38)", () => {
    const store = useCharacterStore.getState();
    store.setClass("guerreiro"); // tem ASI no nível 6, único entre as classes comuns
    store.setLevel(6);
    store.setAsiMode(6, "feat");
    expect(useCharacterStore.getState().character.asiSelections[6]).toEqual({ kind: "feat" });

    store.setClass("mago"); // não tem ASI no nível 6
    expect(useCharacterStore.getState().character.asiSelections[6]).toBeUndefined();
  });

  it("baixar o nível remove os ASIs de níveis que não existem mais (§40)", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setLevel(8);
    store.setAsiMode(4, "feat");
    store.setAsiMode(8, "feat");

    store.setLevel(4);
    const { asiSelections } = useCharacterStore.getState().character;
    expect(asiSelections[4]).toEqual({ kind: "feat" });
    expect(asiSelections[8]).toBeUndefined();
  });

  it("o bônus de ASI afeta getEffectiveAbilityScore", () => {
    const store = useCharacterStore.getState();
    store.setClass("mago");
    store.setLevel(4);
    store.setAbilityScore("FOR", 15);
    store.setAsiMode(4, "abilityIncrease");
    store.increaseAsiAbility(4, "FOR");
    store.increaseAsiAbility(4, "FOR");
    expect(getEffectiveAbilityScore(useCharacterStore.getState().character, "FOR")).toBe(17);
  });
});

describe("useCharacterStore — Homebrew de Ferramentas (REORGANIZAÇÃO DO BUILDER §5)", () => {
  it("enableToolsHomebrew copia a escolha automática atual, sem perder os dados automáticos", () => {
    const store = useCharacterStore.getState();
    store.setClass("bardo");
    store.setFeatureChoiceSelection(getClassToolChoiceId("bardo"), ["alaude", "flauta", "tambor"]);

    store.enableToolsHomebrew();
    expect(useCharacterStore.getState().character.manualToolOverrides).toEqual(["alaude", "flauta", "tambor"]);
    // A escolha automática original continua lá, intocada.
    expect(useCharacterStore.getState().character.featureChoiceSelections[getClassToolChoiceId("bardo")]?.value).toEqual([
      "alaude",
      "flauta",
      "tambor",
    ]);
  });

  it("addManualTool/removeManualTool só têm efeito com Homebrew ativo", () => {
    const store = useCharacterStore.getState();
    store.setClass("bardo");
    store.enableToolsHomebrew();
    store.addManualTool("ferramentas-ladrao");
    expect(useCharacterStore.getState().character.manualToolOverrides).toEqual(["ferramentas-ladrao"]);

    store.removeManualTool("ferramentas-ladrao");
    expect(useCharacterStore.getState().character.manualToolOverrides).toEqual([]);
  });

  it("disableToolsHomebrew volta a null — nunca perde a escolha automática", () => {
    const store = useCharacterStore.getState();
    store.setClass("bardo");
    store.setFeatureChoiceSelection(getClassToolChoiceId("bardo"), ["alaude", "flauta", "tambor"]);
    store.enableToolsHomebrew();
    store.addManualTool("ferramentas-ladrao");

    store.disableToolsHomebrew();
    expect(useCharacterStore.getState().character.manualToolOverrides).toBeNull();
    expect(useCharacterStore.getState().character.featureChoiceSelections[getClassToolChoiceId("bardo")]?.value).toEqual([
      "alaude",
      "flauta",
      "tambor",
    ]);
  });
});
