import { describe, expect, it } from "vitest";
import { createBlankCharacter } from "../domain/character.js";
import { getClassSkillChoiceId } from "../data/classes.js";
import { ELFO_SENTIDOS_AGUCADOS_CHOICE_ID } from "../data/features/species.js";
import { RANGER_ESPECIALISTA_EXPERTISE_CHOICE_ID, RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID } from "../data/features/ranger.js";
import { RANGER_GLAMOUR_SKILL_CHOICE_ID } from "../data/features/subclasses.js";
import { getInvalidExpertiseSelections, getRedundantSkillChoiceSelections } from "./skillChoiceConflicts.js";

/**
 * Fonte "REORGANIZAR O BUILDER E CORRIGIR VALIDAÇÕES EXISTENTES" §4:
 * "o jogador escolhe uma perícia de Classe e depois seleciona um
 * Antecedente que concede a mesma perícia" — Guerreiro pode escolher
 * "Intuição" em Perícias de Classe, e o Acólito concede "Intuição"
 * automaticamente, então essa combinação reproduz o exemplo literal da
 * fonte em qualquer ordem de escolha.
 */
function guerreiroComIntuicaoEscolhida() {
  const character = createBlankCharacter("skill-conflict-test");
  character.classId = "guerreiro";
  character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["intuicao", "atletismo"] };
  return character;
}

describe("getRedundantSkillChoiceSelections — detecção independente da ordem de escolha (§4)", () => {
  it("Classe escolhida primeiro, Antecedente depois: 'Intuição' escolhida em Perícias de Classe fica redundante quando o Acólito também a concede", () => {
    const character = { ...guerreiroComIntuicaoEscolhida(), backgroundId: "acolito" as const };
    const entries = getRedundantSkillChoiceSelections(character);
    expect(entries).toEqual([
      { choiceId: getClassSkillChoiceId("guerreiro"), featureName: "Perícias de Classe", sourceType: "class", skill: "intuicao" },
    ]);
  });

  it("mesmo estado final, construído em ordem inversa (Antecedente 'presente' antes da Classe ser atribuída): resultado idêntico — a função nunca depende de COMO se chegou ao estado, só do estado em si", () => {
    const comClassePrimeiro = { ...guerreiroComIntuicaoEscolhida(), backgroundId: "acolito" as const };

    const base = createBlankCharacter("skill-conflict-test-2");
    const comAntecedentePrimeiro = { ...base, backgroundId: "acolito" as const, classId: "guerreiro" as const };
    comAntecedentePrimeiro.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["intuicao", "atletismo"] };

    expect(getRedundantSkillChoiceSelections(comAntecedentePrimeiro)).toEqual(getRedundantSkillChoiceSelections(comClassePrimeiro));
  });

  it("nunca escolhe uma substituta automaticamente — a seleção redundante continua gravada tal como o jogador deixou, só sinalizada", () => {
    const character = { ...guerreiroComIntuicaoEscolhida(), backgroundId: "acolito" as const };
    getRedundantSkillChoiceSelections(character);
    expect(character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")]?.value).toEqual(["intuicao", "atletismo"]);
  });

  it("sem sobreposição real entre as origens, não reporta nada", () => {
    const character = { ...guerreiroComIntuicaoEscolhida(), backgroundId: "artesao" as const }; // Artesão concede Investigação/Persuasão — nunca Intuição/Atletismo
    expect(getRedundantSkillChoiceSelections(character)).toEqual([]);
  });

  it("resolvida a troca (jogador escolhe outra perícia no lugar), a pendência desaparece", () => {
    const character = guerreiroComIntuicaoEscolhida();
    character.backgroundId = "acolito";
    expect(getRedundantSkillChoiceSelections(character)).toHaveLength(1);

    character.featureChoiceSelections[getClassSkillChoiceId("guerreiro")] = { value: ["percepcao", "atletismo"] };
    expect(getRedundantSkillChoiceSelections(character)).toEqual([]);
  });

  it("Espécie (Sentidos Aguçados do Elfo) redundante com Antecedente — mesma detecção para a origem 'species'", () => {
    const character = createBlankCharacter("skill-conflict-elfo");
    character.speciesId = "elfo";
    character.speciesLineageId = "elfo-drow";
    character.featureChoiceSelections[ELFO_SENTIDOS_AGUCADOS_CHOICE_ID] = { value: ["intuicao"] };
    character.backgroundId = "acolito"; // concede "intuicao" automaticamente

    const entries = getRedundantSkillChoiceSelections(character);
    expect(entries).toEqual([
      { choiceId: ELFO_SENTIDOS_AGUCADOS_CHOICE_ID, featureName: "Traços de Elfo", sourceType: "species", skill: "intuicao" },
    ]);
  });

  it("remover a origem que causava a redundância (trocar de Antecedente) limpa a pendência sem apagar a escolha original", () => {
    const character = { ...guerreiroComIntuicaoEscolhida(), backgroundId: "acolito" as const };
    expect(getRedundantSkillChoiceSelections(character)).toHaveLength(1);

    const semAntecedente = { ...character, backgroundId: null };
    expect(getRedundantSkillChoiceSelections(semAntecedente)).toEqual([]);
    expect(semAntecedente.featureChoiceSelections[getClassSkillChoiceId("guerreiro")]?.value).toEqual(["intuicao", "atletismo"]);
  });

  it("limite conhecido de escopo: nunca compara duas escolhas da MESMA origem entre si (ex.: duas escolhas de Classe sobrepostas) — só cruza origens diferentes, por decisão explícita de não inventar uma regra de compensação nova (§4: 'nunca criar novas regras de compensação para duplicidade')", () => {
    const character = createBlankCharacter("skill-conflict-same-source");
    character.classId = "bardo";
    // Hipótese: se existisse uma 2ª escolha de Classe também com `excludeAlreadyProficient` sobrepondo
    // a mesma perícia, a função não a reportaria contra a 1ª escolha de Classe — só contra
    // Antecedente/Espécie. Sem backgroundId/speciesId aqui, não deve haver nenhuma pendência,
    // mesmo que a própria "Perícias de Classe" do Bardo tenha sido preenchida.
    character.featureChoiceSelections[getClassSkillChoiceId("bardo")] = { value: ["atuacao", "enganacao"] };
    expect(getRedundantSkillChoiceSelections(character)).toEqual([]);
  });

  it("Subclasse (Glamour Transcendental do Andarilho Feérico) redundante com Antecedente — mesma detecção para a origem 'subclass' (fonte \"IMPLEMENTAR SUBCLASSES DO PATRULHEIRO NO BUILDER E NO PDF\" §2/§6)", () => {
    const character = createBlankCharacter("skill-conflict-ranger");
    character.classId = "patrulheiro";
    character.subclassId = "Andarilho Feérico";
    character.level = 3;
    character.featureChoiceSelections[RANGER_GLAMOUR_SKILL_CHOICE_ID] = { value: ["persuasao"] };
    character.backgroundId = "artesao"; // concede Investigação/Persuasão automaticamente, depois da escolha já feita

    const entries = getRedundantSkillChoiceSelections(character);
    expect(entries).toEqual([
      { choiceId: RANGER_GLAMOUR_SKILL_CHOICE_ID, featureName: "Glamour Transcendental", sourceType: "subclass", skill: "persuasao" },
    ]);

    // nunca escolhe uma substituta sozinho — a seleção de subclasse continua intocada.
    expect(character.featureChoiceSelections[RANGER_GLAMOUR_SKILL_CHOICE_ID]?.value).toEqual(["persuasao"]);
  });
});

/**
 * Fonte "CENTRALIZAR AS ESCOLHAS DE PERÍCIAS EM UMA ETAPA PRÓPRIA" §4:
 * "revalidar Especializações que dependam das proficiências alteradas"
 * — Especialização (`skillExpertise`) exige proficiência vigente; se a
 * origem da proficiência some depois da escolha, a seleção de
 * Especialização fica inválida (sinalizada, nunca trocada sozinha).
 */
describe("getInvalidExpertiseSelections — revalida Especialização contra a proficiência vigente, independente da ordem (§4)", () => {
  function patrulheiroComExplorarorHabilEmIntuicao() {
    const character = createBlankCharacter("expertise-conflict-test");
    character.classId = "patrulheiro";
    character.level = 2;
    character.backgroundId = "acolito"; // concede "intuicao"/"religiao" — proficiência de origem da Especialização
    character.featureChoiceSelections[RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID] = { value: ["intuicao"] };
    return character;
  }

  it("proficiência ainda vigente (via Antecedente): nenhuma pendência", () => {
    expect(getInvalidExpertiseSelections(patrulheiroComExplorarorHabilEmIntuicao())).toEqual([]);
  });

  it("Antecedente removido depois da escolha: a Especialização em 'Intuição' fica sem proficiência de origem — sinalizada, nunca trocada sozinha", () => {
    const character = { ...patrulheiroComExplorarorHabilEmIntuicao(), backgroundId: null };
    const entries = getInvalidExpertiseSelections(character);
    expect(entries).toEqual([
      {
        choiceId: RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID,
        featureName: "Explorador Hábil",
        sourceType: "class",
        skill: "intuicao",
      },
    ]);
    expect(character.featureChoiceSelections[RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID]?.value).toEqual(["intuicao"]);
  });

  it("mesmo estado final, construído sem nunca ter passado pelo Antecedente: resultado idêntico — independe da ordem", () => {
    const comAntecedenteRemovidoDepois = { ...patrulheiroComExplorarorHabilEmIntuicao(), backgroundId: null };

    const semAntecedenteDesdeOInicio = createBlankCharacter("expertise-conflict-test-2");
    semAntecedenteDesdeOInicio.classId = "patrulheiro";
    semAntecedenteDesdeOInicio.level = 2;
    semAntecedenteDesdeOInicio.featureChoiceSelections[RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID] = { value: ["intuicao"] };

    expect(getInvalidExpertiseSelections(semAntecedenteDesdeOInicio)).toEqual(getInvalidExpertiseSelections(comAntecedenteRemovidoDepois));
  });

  it("resolvida a troca (jogador escolhe outra perícia ainda proficiente), a pendência desaparece", () => {
    const character = { ...patrulheiroComExplorarorHabilEmIntuicao(), backgroundId: null };
    expect(getInvalidExpertiseSelections(character)).toHaveLength(1);

    character.featureChoiceSelections[getClassSkillChoiceId("patrulheiro")] = { value: ["atletismo"] };
    character.featureChoiceSelections[RANGER_EXPLORADOR_HABIL_EXPERTISE_CHOICE_ID] = { value: ["atletismo"] };
    expect(getInvalidExpertiseSelections(character)).toEqual([]);
  });

  it("proficiência mantida por OUTRA origem (Classe) depois de perder o Antecedente: nenhuma pendência — a Especialização em si nunca concede a proficiência", () => {
    const character = patrulheiroComExplorarorHabilEmIntuicao();
    character.backgroundId = null;
    character.featureChoiceSelections[getClassSkillChoiceId("patrulheiro")] = { value: ["intuicao"] };
    expect(getInvalidExpertiseSelections(character)).toEqual([]);
  });

  it("segunda escolha de Especialização do Patrulheiro (nível 9, 'Especialista') é verificada da mesma forma", () => {
    const character = createBlankCharacter("expertise-conflict-test-3");
    character.classId = "patrulheiro";
    character.level = 9;
    character.featureChoiceSelections[RANGER_ESPECIALISTA_EXPERTISE_CHOICE_ID] = { value: ["natureza", "furtividade"] };
    // Sem nenhuma origem concedendo "natureza"/"furtividade" — ambas inválidas.
    const entries = getInvalidExpertiseSelections(character);
    expect(entries.map((e) => e.skill).sort()).toEqual(["furtividade", "natureza"]);
    expect(entries.every((e) => e.featureName === "Especialista" && e.sourceType === "class")).toBe(true);
  });

  it("classe/subclasse sem nenhuma escolha de Especialização — []", () => {
    const character = createBlankCharacter("expertise-conflict-test-4");
    character.classId = "mago";
    expect(getInvalidExpertiseSelections(character)).toEqual([]);
  });
});
