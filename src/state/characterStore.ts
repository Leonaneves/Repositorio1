import { create } from "zustand";
import type { AbilityKey } from "../domain/common.js";
import {
  createBlankCharacter,
  type ArmorProficiencies,
  type AttackEntry,
  type Character,
  type SpellPreparedEntry,
} from "../domain/character.js";
import type { ArmorId, BackgroundId, ClassId, SizeId, SkillKey, SpeciesId, SpellCircle } from "../domain/ids.js";
import type { AsiSelection } from "../domain/character.js";
import { classes } from "../data/classes.js";
import { ASI_LEVELS_BY_CLASS } from "../data/features/classes.js";
import { ORDEM_DIVINA_CHOICE_ID } from "../data/features/cleric.js";
import { ORDEM_PRIMAL_CHOICE_ID } from "../data/features/druid.js";
import { EARTH_CIRCLE_TERRAIN_CHOICE_ID, ELEMENTAL_AFFINITY_CHOICE_ID } from "../data/features/subclasses.js";
import { getAvailableArmor } from "../rules/armor.js";
import { canChooseSubclass, getAvailableSubclasses } from "../rules/subclasses.js";
import { getSpellSlots } from "../rules/spellcasting.js";
import { formatStartingEquipmentItems, getStartingEquipmentOptions } from "../rules/startingEquipment.js";
import { ASI_ALLOCATION_CONFIG } from "../rules/asi.js";
import { getBackgroundAbilityAllocationConfig } from "../data/backgrounds.js";
import { decreaseAbility, increaseAbility } from "../rules/abilityAllocation.js";
import { getAutomaticClassTools } from "../rules/tools.js";

/**
 * Store central do personagem em construção.
 *
 * Regra de ouro (reforçada nesta etapa): o store guarda SOMENTE inputs
 * e ajustes manuais — o mesmo formato de `Character` usado pelo motor
 * de regras. Nenhuma ação aqui calcula um valor derivado; quando uma
 * ação precisa decidir se uma escolha ainda é válida (ex.: subclasse
 * some ao trocar de classe), ela consulta as funções de `rules/`
 * (`getAvailableSubclasses`, `getAvailableArmor`, `getSpellSlots`) —
 * nunca reimplementa a lógica.
 */

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `char-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Se a armadura equipada não estiver mais entre as disponíveis, volta para "unarmed" — nunca escolhe outra em nome do jogador. */
function clampEquippedArmor(character: Character): Character {
  if (character.armor.equipped === "unarmed") return character;
  const stillAvailable = getAvailableArmor(character).some((a) => a.id === character.armor.equipped);
  if (stillAvailable) return character;
  return { ...character, armor: { ...character.armor, equipped: "unarmed" } };
}

/** Nunca deixa `expended` maior que o total de espaços disponível naquele círculo. */
function clampSpellSlotsExpended(character: Character): Character {
  const totals = getSpellSlots(character);
  let changed = false;
  const slots = { ...character.spellcasting.slots };
  for (const circle of Object.keys(slots).map(Number) as SpellCircle[]) {
    const total = totals[circle];
    const current = slots[circle];
    if (current.expended > total) {
      slots[circle] = { expended: total };
      changed = true;
    }
  }
  if (!changed) return character;
  return { ...character, spellcasting: { ...character.spellcasting, slots } };
}

/**
 * Terreno do Círculo da Terra / Afinidade Elemental são escolhas
 * duradouras guardadas em `featureChoiceSelections`, mas FORA do
 * mecanismo genérico de `FeatureChoice` (ver `rules/builderSteps.ts` —
 * etapa própria, sem `choices` na `FeatureDefinition` para não
 * registrar 2x na etapa "Características e Talentos"). Por isso, ao
 * contrário das escolhas genéricas (que simplesmente desaparecem de
 * `getCharacterFeatures` quando a subclasse muda, sem precisar de
 * limpeza), essas duas precisam ser apagadas explicitamente sempre que
 * a subclasse deixar de ser a dona delas — "trocar Subclasse -> limpar
 * somente escolhas específicas da subclasse anterior" (fonte
 * "CONSOLIDAÇÃO DO BUILDER" §10/§11). Chamada depois de qualquer troca
 * de nível/classe/subclasse.
 */
function clearStaleSubclassOwnedChoices(character: Character): Character {
  const featureChoiceSelections = { ...character.featureChoiceSelections };
  let changed = false;
  if (character.subclassId !== "Círculo da Terra" && EARTH_CIRCLE_TERRAIN_CHOICE_ID in featureChoiceSelections) {
    delete featureChoiceSelections[EARTH_CIRCLE_TERRAIN_CHOICE_ID];
    changed = true;
  }
  if (character.subclassId !== "Feitiçaria Dracônica" && ELEMENTAL_AFFINITY_CHOICE_ID in featureChoiceSelections) {
    delete featureChoiceSelections[ELEMENTAL_AFFINITY_CHOICE_ID];
    changed = true;
  }
  if (!changed) return character;
  return { ...character, featureChoiceSelections };
}

/** `asiSelections` só com os níveis cuja chave ainda está na lista informada — nunca muta o objeto recebido. */
function filterAsiSelections(character: Character, keepLevels: number[]): Character {
  const entries = Object.entries(character.asiSelections).filter(([level]) => keepLevels.includes(Number(level)));
  if (entries.length === Object.keys(character.asiSelections).length) return character;
  return { ...character, asiSelections: Object.fromEntries(entries.map(([level, selection]) => [Number(level), selection])) };
}

/** Remove ASIs de níveis que a CLASSE informada não concede (§38: trocar de classe remove só o que deixa de existir). */
function clampAsiSelectionsToClass(character: Character, classId: ClassId | null): Character {
  const levels = classId ? ASI_LEVELS_BY_CLASS[classId] ?? [] : [];
  return filterAsiSelections(character, levels);
}

/** Remove ASIs de níveis acima do nível ATUAL (§40: baixar o nível remove os ASIs que não existem mais). */
function clampAsiSelectionsToLevel(character: Character): Character {
  const levels = character.classId ? (ASI_LEVELS_BY_CLASS[character.classId] ?? []).filter((level) => level <= character.level) : [];
  return filterAsiSelections(character, levels);
}

/**
 * Efeitos colaterais da troca de classe, extraídos do comportamento do
 * PDF original: zera TODAS as salvaguardas e proficiências de armadura
 * e marca só as da nova classe. Isso permanece seguro porque, neste
 * sistema sem multiclasse, a classe é a ÚNICA fonte dessas duas
 * proficiências (ao contrário das perícias, cuja proficiência final
 * agora é sempre derivada via `getSkillProficiency` — ver
 * `setBackground` abaixo, que não precisa mais tocar em `skills`). A
 * subclasse é limpa se não pertencer à nova classe; a armadura
 * equipada é limpa se deixar de ser permitida.
 */
function applyClassChange(character: Character, classId: ClassId | null): Character {
  const savingThrows = { ...character.savingThrows };
  for (const ability of Object.keys(savingThrows) as AbilityKey[]) {
    savingThrows[ability] = { ...savingThrows[ability], proficient: false };
  }

  let armorProficiencies: ArmorProficiencies = { light: false, medium: false, heavy: false, shield: false };

  if (classId) {
    const definition = classes[classId];
    for (const ability of definition.savingThrowProficiencies) {
      savingThrows[ability] = { ...savingThrows[ability], proficient: true };
    }
    armorProficiencies = { ...definition.armorProficiencies };
  }

  const subclassStillValid = classId !== null && getAvailableSubclasses(classId).some((s) => s.fullName === character.subclassId);

  let next: Character = {
    ...character,
    classId,
    subclassId: subclassStillValid ? character.subclassId : null,
    // As opções de equipamento inicial (A/B/C) são específicas da classe — um id igual em outra classe representa itens diferentes.
    startingEquipmentOptionId: null,
    savingThrows,
    armor: { ...character.armor, proficiencies: armorProficiencies },
    // Invocações Místicas são exclusivas do Bruxo — saem junto com a classe, igual às proficiências de armadura acima.
    chosenInvocations: classId === "bruxo" ? character.chosenInvocations : [],
    // Formas Conhecidas de Forma Selvagem são exclusivas do Druida — mesmo raciocínio das Invocações Místicas acima.
    knownWildShapeForms: classId === "druida" ? character.knownWildShapeForms : [],
    // Metamagia é exclusiva do Feiticeiro — mesmo raciocínio das Invocações Místicas/Formas Conhecidas acima.
    knownMetamagicOptions: classId === "feiticeiro" ? character.knownMetamagicOptions : [],
  };

  next = clampEquippedArmor(next);
  next = clampSpellSlotsExpended(next);
  next = clearStaleSubclassOwnedChoices(next);
  return next;
}

/**
 * Treinamento Marcial (Colégio da Bravura, nível 3 — fonte "INTEGRAÇÃO
 * COMPLETA — BARDO E SUBCLASSES" §16) concede proficiência em Armaduras
 * Médias e Escudos automaticamente ao escolher a subclasse — mesmo
 * padrão de `applyClassChange` (flag mutável, mas sempre editável depois
 * em `ArmorSection`). Só SOMA a proficiência; nunca remove o que o
 * jogador já tinha marcado manualmente, e nunca retira ao trocar de
 * subclasse (consistente com "sempre editável", nunca forçosamente
 * resetado fora da troca de classe). Armas Marciais (texto, não flag)
 * entram em `rules/bardSubclassProficiencies.ts`.
 */
function applyBardSubclassProficiencies(character: Character): Character {
  if (character.classId !== "bardo" || character.subclassId !== "Colégio da Bravura") return character;
  return { ...character, armor: { ...character.armor, proficiencies: { ...character.armor.proficiencies, medium: true, shield: true } } };
}

/**
 * Protetor (Ordem Divina do Clérigo, nível 1 — fonte "INTEGRAÇÃO COMPLETA
 * — CLÉRIGO E SUBCLASSES") concede treinamento com Armadura Pesada
 * automaticamente ao escolher essa opção — mesmo padrão de
 * `applyBardSubclassProficiencies` (flag mutável, sempre editável depois
 * em `ArmorSection`; só SOMA a proficiência, nunca remove o que o jogador
 * já tinha marcado manualmente). Diferente do Bardo, a escolha aqui não é
 * de subclasse, e sim uma `FeatureChoiceSelection` de nível 1
 * (`ORDEM_DIVINA_CHOICE_ID`) — por isso é aplicada em
 * `setFeatureChoiceSelection`, não em `setSubclass`. Armas Marciais
 * (texto, não flag) entram em `rules/clericSubclassProficiencies.ts`.
 */
function applyClericOrdemDivinaProficiencies(character: Character): Character {
  if (character.classId !== "clerigo") return character;
  if (character.featureChoiceSelections[ORDEM_DIVINA_CHOICE_ID]?.value !== "Protetor") return character;
  return { ...character, armor: { ...character.armor, proficiencies: { ...character.armor.proficiencies, heavy: true } } };
}

/**
 * Protetor (Ordem Primal do Druida, nível 1 — fonte "INTEGRAÇÃO COMPLETA
 * — DRUIDA E SUBCLASSES") concede treinamento com Armadura Média
 * automaticamente ao escolher essa opção — mesmíssimo padrão de
 * `applyClericOrdemDivinaProficiencies` (flag mutável, sempre editável;
 * só SOMA, nunca remove escolha manual do jogador). Armas Marciais
 * (texto, não flag) entram em `rules/druidProficiencies.ts`.
 */
function applyDruidOrdemPrimalProficiencies(character: Character): Character {
  if (character.classId !== "druida") return character;
  if (character.featureChoiceSelections[ORDEM_PRIMAL_CHOICE_ID]?.value !== "Protetor") return character;
  return { ...character, armor: { ...character.armor, proficiencies: { ...character.armor.proficiencies, medium: true } } };
}

interface CharacterStore {
  character: Character;

  setName: (name: string) => void;
  setLevel: (level: number) => void;
  setClass: (classId: ClassId | null) => void;
  setSubclass: (subclassId: string | null) => void;
  setSpecies: (speciesId: SpeciesId | null) => void;
  setBackground: (backgroundId: BackgroundId | null) => void;

  setAbilityScore: (ability: AbilityKey, score: number) => void;

  /** Linhagem/Ancestralidade da espécie ATUAL (Draconato/Elfo/Gnomo/Golias/Tiefling) — ver `data/speciesLineages.ts`. */
  setSpeciesLineage: (lineageId: string | null) => void;

  setSkillManualOverride: (skill: SkillKey, value: boolean | null) => void;
  setSkillExpertise: (skill: SkillKey, expertise: boolean) => void;
  setSkillManualAdjustment: (skill: SkillKey, value: number) => void;

  setSavingThrowProficient: (ability: AbilityKey, proficient: boolean) => void;
  setSavingThrowManualAdjustment: (ability: AbilityKey, value: number) => void;

  setInitiativeManualAdjustment: (value: number) => void;
  setPassivePerceptionManualAdjustment: (value: number) => void;

  setSizeManualOverride: (size: SizeId | null) => void;
  setSpeedManualAdjustment: (value: number) => void;

  setArmorEquipped: (armorId: ArmorId | "unarmed") => void;
  setShield: (equipped: boolean) => void;
  setArmorProficiency: (category: keyof ArmorProficiencies, value: boolean) => void;
  setArmorManualAdjustment: (value: number) => void;

  setSpellSaveDCManualAdjustment: (value: number) => void;
  setSpellAttackBonusManualAdjustment: (value: number) => void;
  setSpellSlotExpended: (circle: SpellCircle, expended: number) => void;

  setWeaponProficienciesNotes: (notes: string) => void;
  setToolProficienciesNotes: (notes: string) => void;
  setSpeciesTraitsNotes: (notes: string) => void;
  setTalentsNotes: (notes: string) => void;

  setHpCurrent: (value: number) => void;
  setHpTemp: (value: number) => void;
  setHpMaxManualAdjustment: (value: number) => void;
  setHitDiceSpent: (value: number) => void;

  setDeathSaveSuccesses: (value: number) => void;
  setDeathSaveFailures: (value: number) => void;

  setHeroicInspiration: (value: boolean) => void;

  addAttack: () => void;
  updateAttack: (index: number, patch: Partial<AttackEntry>) => void;
  removeAttack: (index: number) => void;

  addSpellPrepared: () => void;
  updateSpellPrepared: (index: number, patch: Partial<SpellPreparedEntry>) => void;
  removeSpellPrepared: (index: number) => void;

  setAppearance: (value: string) => void;
  setLanguages: (value: string) => void;

  setInventoryEquipment: (value: string) => void;
  setCoin: (coin: "cp" | "sp" | "gp" | "pp", value: number) => void;
  addAttunedItem: () => void;
  updateAttunedItem: (index: number, patch: Partial<{ description: string; attuned: boolean }>) => void;
  removeAttunedItem: (index: number) => void;

  /** Aplica a opção A/B/C de equipamento inicial da classe atual: grava o id escolhido e preenche inventory.equipment/coins.gp com os itens/ouro dela. */
  setStartingEquipmentOption: (optionId: string) => void;

  setFeatureChoiceSelection: (choiceId: string, value: string | string[]) => void;
  clearFeatureChoiceSelection: (choiceId: string) => void;
  addChosenFeat: (featId: string) => void;
  removeChosenFeat: (featId: string) => void;

  /** Adiciona 1 cópia de uma Invocação Mística (`subChoice` começa vazio; repetíveis podem ser adicionadas mais de uma vez). */
  addInvocation: (invocationId: string) => void;
  removeInvocation: (index: number) => void;
  setInvocationSubChoice: (index: number, value: string) => void;

  /** Alterna 1 opção de Metamagia conhecida (nunca duplica — mesmo padrão de addChosenFeat/removeChosenFeat). */
  addMetamagicOption: (optionId: string) => void;
  removeMetamagicOption: (optionId: string) => void;

  /** Adiciona 1 Forma Conhecida em branco de Forma Selvagem do Druida (etapa própria do Builder — ver rules/wildShapeForms.ts). */
  addKnownWildShapeForm: () => void;
  updateKnownWildShapeForm: (index: number, patch: Partial<{ name: string; challengeRating: string; hasFlySpeed: boolean }>) => void;
  removeKnownWildShapeForm: (index: number) => void;

  /** Aumenta/diminui em 1 o bônus de atributo do Antecedente ATUAL (componente genérico de distribuição — ver rules/abilityAllocation.ts). Sem efeito se o Antecedente atual não tiver `abilityScoreOptions`. */
  increaseBackgroundAbilityBonus: (ability: AbilityKey) => void;
  decreaseBackgroundAbilityBonus: (ability: AbilityKey) => void;

  /** Define o modo de um ASI (nível específico) — "feat" ou "abilityIncrease" (sempre reinicia a distribuição anterior, nunca deixa bônus ocultos de uma escolha anterior). */
  setAsiMode: (level: number, kind: AsiSelection["kind"]) => void;
  increaseAsiAbility: (level: number, ability: AbilityKey) => void;
  decreaseAsiAbility: (level: number, ability: AbilityKey) => void;

  /** Modo Homebrew de Ferramentas/Instrumentos — `manualToolOverrides !== null` é o próprio estado "ativo" (ver rules/tools.ts#getKnownTools). Ativar copia a escolha automática atual; desativar volta a `null` (nunca perde os dados automáticos). */
  enableToolsHomebrew: () => void;
  disableToolsHomebrew: () => void;
  addManualTool: (toolId: string) => void;
  removeManualTool: (toolId: string) => void;

  /** Começa um personagem inteiramente novo (novo id anônimo, portanto um novo build de analytics). */
  resetCharacter: () => void;
}

export const useCharacterStore = create<CharacterStore>((set) => ({
  character: createBlankCharacter(generateId()),

  setName: (name) => set((state) => ({ character: { ...state.character, name } })),

  /**
   * A escolha de subclasse só existe a partir do nível 3 (regra fixa
   * para todas as classes — `rules/subclasses.ts#canChooseSubclass`).
   * Cair de 3+ para 1–2 limpa `subclassId` (e, quando a camada de
   * features existir, as features vindas da subclasse com ela).
   */
  setLevel: (level) =>
    set((state) => {
      const subclassId = canChooseSubclass(level) ? state.character.subclassId : null;
      let character = clearStaleSubclassOwnedChoices(clampSpellSlotsExpended({ ...state.character, level, subclassId }));
      // Baixar o nível remove os ASIs que deixaram de existir na progressão (§40) — nunca os de nível ainda alcançável.
      character = clampAsiSelectionsToLevel(character);
      return { character };
    }),

  setClass: (classId) =>
    set((state) => ({ character: clampAsiSelectionsToClass(applyClassChange(state.character, classId), classId) })),

  setSubclass: (subclassId) =>
    set((state) => {
      if (!canChooseSubclass(state.character.level)) return state;
      const character = clearStaleSubclassOwnedChoices(
        applyBardSubclassProficiencies(clampSpellSlotsExpended({ ...state.character, subclassId })),
      );
      return { character };
    }),

  // Trocar de espécie limpa a Linhagem/Ancestralidade escolhida — nunca acumula a linhagem antiga com a
  // nova (fonte "IMPLEMENTAR LINHAGENS..." §2). Sem mudança real de espécie, não apaga a escolha já feita
  // (ex.: o próprio <select> disparando o mesmo valor de novo).
  setSpecies: (speciesId) =>
    set((state) => {
      if (speciesId === state.character.speciesId) return state;
      return { character: { ...state.character, speciesId, speciesLineageId: null } };
    }),

  setSpeciesLineage: (lineageId) => set((state) => ({ character: { ...state.character, speciesLineageId: lineageId } })),

  /**
   * Trocar de antecedente é agora uma escrita trivial: nenhuma perícia
   * precisa ser marcada/desmarcada aqui. `getSkillProficiency` (em
   * `rules/skills.ts`) já recalcula sozinha quais perícias o
   * antecedente ATUAL concede; qualquer `manualOverride` que o
   * jogador tenha definido continua intocado, seja qual for o
   * antecedente (ver §1.1 do pedido: Nobre → Soldado troca as
   * proficiências automáticas sem apagar escolhas manuais).
   */
  // Trocar de Antecedente nunca acumula o bônus do antigo com o novo (§39) — a distribuição de Aumentos de Atributo volta sempre a {}, exigindo nova distribuição.
  setBackground: (backgroundId) => set((state) => ({ character: { ...state.character, backgroundId, backgroundAbilityBonuses: {} } })),

  setAbilityScore: (ability, score) =>
    set((state) => ({
      character: { ...state.character, abilities: { ...state.character.abilities, [ability]: { score } } },
    })),

  setSkillManualOverride: (skill, value) =>
    set((state) => ({
      character: {
        ...state.character,
        skills: { ...state.character.skills, [skill]: { ...state.character.skills[skill], manualOverride: value } },
      },
    })),

  setSkillExpertise: (skill, expertise) =>
    set((state) => ({
      character: {
        ...state.character,
        skills: { ...state.character.skills, [skill]: { ...state.character.skills[skill], expertise } },
      },
    })),

  setSkillManualAdjustment: (skill, value) =>
    set((state) => ({
      character: {
        ...state.character,
        skills: { ...state.character.skills, [skill]: { ...state.character.skills[skill], manualAdjustment: value } },
      },
    })),

  setSavingThrowProficient: (ability, proficient) =>
    set((state) => ({
      character: {
        ...state.character,
        savingThrows: { ...state.character.savingThrows, [ability]: { ...state.character.savingThrows[ability], proficient } },
      },
    })),

  setSavingThrowManualAdjustment: (ability, value) =>
    set((state) => ({
      character: {
        ...state.character,
        savingThrows: {
          ...state.character.savingThrows,
          [ability]: { ...state.character.savingThrows[ability], manualAdjustment: value },
        },
      },
    })),

  setInitiativeManualAdjustment: (value) =>
    set((state) => ({ character: { ...state.character, initiative: { manualAdjustment: value } } })),

  setPassivePerceptionManualAdjustment: (value) =>
    set((state) => ({ character: { ...state.character, passivePerception: { manualAdjustment: value } } })),

  setSizeManualOverride: (size) => set((state) => ({ character: { ...state.character, size: { manualOverride: size } } })),

  setSpeedManualAdjustment: (value) =>
    set((state) => ({ character: { ...state.character, speed: { manualAdjustment: value } } })),

  setArmorEquipped: (armorId) =>
    set((state) => ({ character: { ...state.character, armor: { ...state.character.armor, equipped: armorId } } })),

  setShield: (equipped) =>
    set((state) => ({ character: { ...state.character, armor: { ...state.character.armor, shield: equipped } } })),

  setArmorProficiency: (category, value) =>
    set((state) => {
      const proficiencies = { ...state.character.armor.proficiencies, [category]: value };
      const next = { ...state.character, armor: { ...state.character.armor, proficiencies } };
      return { character: clampEquippedArmor(next) };
    }),

  setArmorManualAdjustment: (value) =>
    set((state) => ({ character: { ...state.character, armor: { ...state.character.armor, manualAdjustment: value } } })),

  setSpellSaveDCManualAdjustment: (value) =>
    set((state) => ({
      character: { ...state.character, spellcasting: { ...state.character.spellcasting, manualSaveDCAdjustment: value } },
    })),

  setSpellAttackBonusManualAdjustment: (value) =>
    set((state) => ({
      character: { ...state.character, spellcasting: { ...state.character.spellcasting, manualAttackBonusAdjustment: value } },
    })),

  setSpellSlotExpended: (circle, expended) =>
    set((state) => ({
      character: {
        ...state.character,
        spellcasting: {
          ...state.character.spellcasting,
          slots: { ...state.character.spellcasting.slots, [circle]: { expended } },
        },
      },
    })),

  setWeaponProficienciesNotes: (notes) => set((state) => ({ character: { ...state.character, weaponProficienciesNotes: notes } })),
  setToolProficienciesNotes: (notes) => set((state) => ({ character: { ...state.character, toolProficienciesNotes: notes } })),
  setSpeciesTraitsNotes: (notes) => set((state) => ({ character: { ...state.character, speciesTraitsNotes: notes } })),
  setTalentsNotes: (notes) => set((state) => ({ character: { ...state.character, talentsNotes: notes } })),

  setHpCurrent: (value) => set((state) => ({ character: { ...state.character, hp: { ...state.character.hp, current: value } } })),
  setHpTemp: (value) => set((state) => ({ character: { ...state.character, hp: { ...state.character.hp, temp: value } } })),
  setHpMaxManualAdjustment: (value) =>
    set((state) => ({ character: { ...state.character, hp: { ...state.character.hp, maxManualAdjustment: value } } })),
  setHitDiceSpent: (value) =>
    set((state) => ({ character: { ...state.character, hp: { ...state.character.hp, hitDiceSpent: value } } })),

  setDeathSaveSuccesses: (value) =>
    set((state) => ({ character: { ...state.character, deathSaves: { ...state.character.deathSaves, successes: value } } })),
  setDeathSaveFailures: (value) =>
    set((state) => ({ character: { ...state.character, deathSaves: { ...state.character.deathSaves, failures: value } } })),

  setHeroicInspiration: (value) => set((state) => ({ character: { ...state.character, heroicInspiration: value } })),

  addAttack: () =>
    set((state) => ({
      character: {
        ...state.character,
        attacks: [...state.character.attacks, { name: "", attackBonus: "", damage: "", notes: "" }],
      },
    })),
  updateAttack: (index, patch) =>
    set((state) => ({
      character: {
        ...state.character,
        attacks: state.character.attacks.map((attack, i) => (i === index ? { ...attack, ...patch } : attack)),
      },
    })),
  removeAttack: (index) =>
    set((state) => ({
      character: { ...state.character, attacks: state.character.attacks.filter((_, i) => i !== index) },
    })),

  addSpellPrepared: () =>
    set((state) => ({
      character: {
        ...state.character,
        spellsPrepared: [
          ...state.character.spellsPrepared,
          { circle: "", name: "", castingTime: "", range: "", concentration: false, ritual: false, material: false, notes: "" },
        ],
      },
    })),
  updateSpellPrepared: (index, patch) =>
    set((state) => ({
      character: {
        ...state.character,
        spellsPrepared: state.character.spellsPrepared.map((spell, i) => (i === index ? { ...spell, ...patch } : spell)),
      },
    })),
  removeSpellPrepared: (index) =>
    set((state) => ({
      character: { ...state.character, spellsPrepared: state.character.spellsPrepared.filter((_, i) => i !== index) },
    })),

  setAppearance: (value) => set((state) => ({ character: { ...state.character, appearance: value } })),
  setLanguages: (value) => set((state) => ({ character: { ...state.character, languages: value } })),

  setInventoryEquipment: (value) =>
    set((state) => ({ character: { ...state.character, inventory: { ...state.character.inventory, equipment: value } } })),

  setStartingEquipmentOption: (optionId) =>
    set((state) => {
      const option = getStartingEquipmentOptions(state.character).find((o) => o.id === optionId);
      if (!option) return state;
      return {
        character: {
          ...state.character,
          startingEquipmentOptionId: optionId,
          inventory: {
            ...state.character.inventory,
            equipment: formatStartingEquipmentItems(option),
            // `goldFormula` (ex.: Artífice "5d4 × 10") nunca é convertida num número
            // sozinha — o campo de Ouro fica como está para o jogador preencher à mão
            // com o resultado já rolado (mesmo campo manual de sempre, ver Step9Equipment).
            coins: option.gold !== undefined ? { ...state.character.inventory.coins, gp: option.gold } : state.character.inventory.coins,
          },
        },
      };
    }),

  setCoin: (coin, value) =>
    set((state) => ({
      character: {
        ...state.character,
        inventory: { ...state.character.inventory, coins: { ...state.character.inventory.coins, [coin]: value } },
      },
    })),
  addAttunedItem: () =>
    set((state) => ({
      character: {
        ...state.character,
        inventory: {
          ...state.character.inventory,
          attunedItems: [...state.character.inventory.attunedItems, { description: "", attuned: false }],
        },
      },
    })),
  updateAttunedItem: (index, patch) =>
    set((state) => ({
      character: {
        ...state.character,
        inventory: {
          ...state.character.inventory,
          attunedItems: state.character.inventory.attunedItems.map((item, i) => (i === index ? { ...item, ...patch } : item)),
        },
      },
    })),
  removeAttunedItem: (index) =>
    set((state) => ({
      character: {
        ...state.character,
        inventory: {
          ...state.character.inventory,
          attunedItems: state.character.inventory.attunedItems.filter((_, i) => i !== index),
        },
      },
    })),

  setFeatureChoiceSelection: (choiceId, value) =>
    set((state) => {
      let character = {
        ...state.character,
        featureChoiceSelections: { ...state.character.featureChoiceSelections, [choiceId]: { value } },
      };
      if (choiceId === ORDEM_DIVINA_CHOICE_ID) character = applyClericOrdemDivinaProficiencies(character);
      if (choiceId === ORDEM_PRIMAL_CHOICE_ID) character = applyDruidOrdemPrimalProficiencies(character);
      return { character };
    }),
  clearFeatureChoiceSelection: (choiceId) =>
    set((state) => {
      const featureChoiceSelections = { ...state.character.featureChoiceSelections };
      delete featureChoiceSelections[choiceId];
      return { character: { ...state.character, featureChoiceSelections } };
    }),
  addChosenFeat: (featId) =>
    set((state) => {
      if (state.character.chosenFeatIds.includes(featId)) return state;
      return { character: { ...state.character, chosenFeatIds: [...state.character.chosenFeatIds, featId] } };
    }),
  removeChosenFeat: (featId) =>
    set((state) => ({
      character: { ...state.character, chosenFeatIds: state.character.chosenFeatIds.filter((id) => id !== featId) },
    })),

  addInvocation: (invocationId) =>
    set((state) => ({
      character: { ...state.character, chosenInvocations: [...state.character.chosenInvocations, { invocationId, subChoice: "" }] },
    })),
  removeInvocation: (index) =>
    set((state) => ({
      character: { ...state.character, chosenInvocations: state.character.chosenInvocations.filter((_, i) => i !== index) },
    })),
  setInvocationSubChoice: (index, value) =>
    set((state) => {
      const chosenInvocations = state.character.chosenInvocations.map((chosen, i) => (i === index ? { ...chosen, subChoice: value } : chosen));
      return { character: { ...state.character, chosenInvocations } };
    }),

  addKnownWildShapeForm: () =>
    set((state) => ({
      character: {
        ...state.character,
        knownWildShapeForms: [...state.character.knownWildShapeForms, { name: "", challengeRating: "", hasFlySpeed: false }],
      },
    })),
  updateKnownWildShapeForm: (index, patch) =>
    set((state) => {
      const knownWildShapeForms = state.character.knownWildShapeForms.map((form, i) => (i === index ? { ...form, ...patch } : form));
      return { character: { ...state.character, knownWildShapeForms } };
    }),
  removeKnownWildShapeForm: (index) =>
    set((state) => ({
      character: { ...state.character, knownWildShapeForms: state.character.knownWildShapeForms.filter((_, i) => i !== index) },
    })),

  addMetamagicOption: (optionId) =>
    set((state) => {
      if (state.character.knownMetamagicOptions.includes(optionId)) return state;
      return { character: { ...state.character, knownMetamagicOptions: [...state.character.knownMetamagicOptions, optionId] } };
    }),
  removeMetamagicOption: (optionId) =>
    set((state) => ({
      character: { ...state.character, knownMetamagicOptions: state.character.knownMetamagicOptions.filter((id) => id !== optionId) },
    })),

  increaseBackgroundAbilityBonus: (ability) =>
    set((state) => {
      if (!state.character.backgroundId) return state;
      const config = getBackgroundAbilityAllocationConfig(state.character.backgroundId);
      const backgroundAbilityBonuses = increaseAbility(config, state.character.backgroundAbilityBonuses, ability);
      return { character: { ...state.character, backgroundAbilityBonuses } };
    }),
  decreaseBackgroundAbilityBonus: (ability) =>
    set((state) => ({
      character: { ...state.character, backgroundAbilityBonuses: decreaseAbility(state.character.backgroundAbilityBonuses, ability) },
    })),

  // Trocar de modo nunca deixa bônus ocultos de uma escolha anterior (§28) — sempre reinicia do zero.
  setAsiMode: (level, kind) =>
    set((state) => {
      const selection: AsiSelection = kind === "feat" ? { kind: "feat" } : { kind: "abilityIncrease", allocations: {} };
      return { character: { ...state.character, asiSelections: { ...state.character.asiSelections, [level]: selection } } };
    }),
  increaseAsiAbility: (level, ability) =>
    set((state) => {
      const current = state.character.asiSelections[level];
      if (!current || current.kind !== "abilityIncrease") return state;
      const allocations = increaseAbility(ASI_ALLOCATION_CONFIG, current.allocations, ability);
      const selection: AsiSelection = { kind: "abilityIncrease", allocations };
      return { character: { ...state.character, asiSelections: { ...state.character.asiSelections, [level]: selection } } };
    }),
  decreaseAsiAbility: (level, ability) =>
    set((state) => {
      const current = state.character.asiSelections[level];
      if (!current || current.kind !== "abilityIncrease") return state;
      const allocations = decreaseAbility(current.allocations, ability);
      const selection: AsiSelection = { kind: "abilityIncrease", allocations };
      return { character: { ...state.character, asiSelections: { ...state.character.asiSelections, [level]: selection } } };
    }),

  enableToolsHomebrew: () =>
    set((state) => {
      if (state.character.manualToolOverrides !== null) return state;
      return { character: { ...state.character, manualToolOverrides: getAutomaticClassTools(state.character) } };
    }),
  disableToolsHomebrew: () => set((state) => ({ character: { ...state.character, manualToolOverrides: null } })),
  addManualTool: (toolId) =>
    set((state) => {
      const current = state.character.manualToolOverrides ?? [];
      if (current.includes(toolId)) return state;
      return { character: { ...state.character, manualToolOverrides: [...current, toolId] } };
    }),
  removeManualTool: (toolId) =>
    set((state) => ({
      character: { ...state.character, manualToolOverrides: (state.character.manualToolOverrides ?? []).filter((id) => id !== toolId) },
    })),

  resetCharacter: () => set({ character: createBlankCharacter(generateId()) }),
}));
