import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { mapCharacterToBuild } from "./mapCharacterToBuild.js";

describe("mapCharacterToBuild", () => {
  it("copia apenas escolhas estruturadas de criação de personagem", () => {
    const character = createBlankCharacter("build-test-1");
    character.name = "Personagem de Teste"; // nunca deve aparecer no build
    character.classId = "mago";
    character.subclassId = "Evocador";
    character.speciesId = "humano";
    character.backgroundId = "sabio";
    character.level = 5;
    character.abilities.INT.score = 18;
    character.skills.arcanismo.manualOverride = true;
    character.skills.arcanismo.expertise = true;
    character.savingThrows.INT.proficient = true;
    character.armor.equipped = "unarmed";

    const build = mapCharacterToBuild(character, "2026-01-01T00:00:00.000Z");

    expect(build.buildId).toBe("build-test-1");
    expect(build.classId).toBe("mago");
    expect(build.subclassId).toBe("Evocador");
    expect(build.speciesId).toBe("humano");
    expect(build.backgroundId).toBe("sabio");
    expect(build.level).toBe(5);
    expect(build.abilityScores.INT).toBe(18);
    expect(build.skillProficiencies).toContain("arcanismo");
    expect(build.skillExpertise).toContain("arcanismo");
    expect(build.savingThrowProficiencies).toContain("INT");
    expect(build.armorId).toBeNull();
    expect(build.spellcastingAbility).toBe("INT");
    expect(build.updatedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("NUNCA inclui nome do personagem, texto livre ou qualquer campo pessoal", () => {
    const character = createBlankCharacter("build-test-2");
    character.name = "Nome Secreto";
    character.appearance = "Cabelo ruivo, cicatriz no rosto";
    character.languages = "Comum, Élfico";
    character.talentsNotes = "Nota pessoal do jogador";
    character.speciesTraitsNotes = "Outra nota pessoal";
    character.weaponProficienciesNotes = "Mais uma nota";
    character.toolProficienciesNotes = "E mais uma";
    character.classFeatures = { column1: "texto livre", column2: "texto livre 2" };
    character.inventory.equipment = "Mochila, corda, tocha";

    const build = mapCharacterToBuild(character);
    const serialized = JSON.stringify(build);

    // O tipo CharacterBuild não declara essas chaves; confirmamos também
    // em runtime que nenhum valor de texto livre vazou para o objeto.
    expect(serialized).not.toContain("Nome Secreto");
    expect(serialized).not.toContain("Cabelo ruivo");
    expect(serialized).not.toContain("Comum, Élfico");
    expect(serialized).not.toContain("Nota pessoal");
    expect(serialized).not.toContain("Mochila");
    expect(Object.keys(build)).not.toContain("name");
    expect(Object.keys(build)).not.toContain("appearance");
    expect(Object.keys(build)).not.toContain("languages");
    expect(Object.keys(build)).not.toContain("inventory");
  });

  it("registra a armadura equipada quando houver uma", () => {
    const character = createBlankCharacter("build-test-3");
    character.armor.equipped = "placas";
    character.armor.shield = true;
    const build = mapCharacterToBuild(character);
    expect(build.armorId).toBe("placas");
    expect(build.shield).toBe(true);
  });

  it("spellcastingAbility é null para classes não conjuradoras sem antecedente de conjuração", () => {
    const character = createBlankCharacter("build-test-4");
    character.classId = "barbaro";
    const build = mapCharacterToBuild(character);
    expect(build.spellcastingAbility).toBeNull();
  });

  it("origin/status/referenceSource têm sempre o mesmo valor padrão (fonte §2) — status NUNCA é 'confirmed' aqui, mesmo sem pendências", () => {
    const character = createBlankCharacter("build-test-5");
    const build = mapCharacterToBuild(character);
    expect(build.origin).toBe("user");
    expect(build.status).toBe("draft");
    expect(build.referenceSource).toBeNull();
  });

  it("talentAcquisitions reflete rules/talentAcquisitionHistory.ts (nunca uma lista vazia à parte/duplicada)", () => {
    const character = createBlankCharacter("build-test-6");
    character.backgroundId = "soldado"; // concede Atacante Selvagem, sem escolhas internas
    const build = mapCharacterToBuild(character);
    expect(build.talentAcquisitions).toHaveLength(1);
    expect(build.talentAcquisitions[0].talentId).toBe("atacante-selvagem");
    expect(build.talentAcquisitions[0].opportunityId).toBe("background");
  });

  it("skillChoices guarda as perícias de CADA escolha de perícia/Especialização já feita, pelo id da escolha", () => {
    const character = createBlankCharacter("build-test-7");
    character.classId = "bardo";
    character.level = 2;
    character.featureChoiceSelections["classe-bardo-pericias"] = { value: ["persuasao", "atuacao", "furtividade"] };
    character.featureChoiceSelections["bardo-especialista-1-escolha"] = { value: ["persuasao", "atuacao"] };
    character.featureChoiceSelections["escolha-que-nao-existe"] = { value: ["arcanismo"] };
    expect(mapCharacterToBuild(character).skillChoices).toEqual({
      "classe-bardo-pericias": ["persuasao", "atuacao", "furtividade"],
      "bardo-especialista-1-escolha": ["persuasao", "atuacao"],
    });
  });

  it("skillChoices fica vazio enquanto nenhuma perícia foi escolhida", () => {
    const character = createBlankCharacter("build-test-8");
    character.classId = "guerreiro";
    expect(mapCharacterToBuild(character).skillChoices).toEqual({});
  });

  it("metamagicOptions copia as opções de Metamagia conhecidas", () => {
    const character = createBlankCharacter("build-test-9");
    character.classId = "feiticeiro";
    character.level = 2;
    character.knownMetamagicOptions = ["acelerada", "duplicada"];
    expect(mapCharacterToBuild(character).metamagicOptions).toEqual(["acelerada", "duplicada"]);
  });
});
