import { getClassSkillChoiceId } from "../data/classes.js";
import { CONHECIMENTO_PRIMORDIAL_CHOICE_ID, getBarbarianWeaponMasteryChoiceId } from "../data/features/barbarian.js";
import { useCharacterStore } from "../state/characterStore.js";

/**
 * Personagens de demonstração — só para desenvolvimento/apresentação
 * (ver o bloco "Carregar exemplo" em `BuilderWizard.tsx`, visível
 * apenas em modo de desenvolvimento — nunca em produção).
 * Nunca uma funcionalidade de produção: preenche o Builder aplicando
 * as MESMAS actions do `characterStore` que a UI real usa (nenhum
 * Character construído à mão), então qualquer regra/gating continua
 * valendo normalmente — é só um atalho para não preencher tudo na mão
 * durante a apresentação.
 */
export type DemoCharacterKind = "fighter" | "wizard" | "barbarian";

export const DEMO_CHARACTERS: { kind: DemoCharacterKind; label: string }[] = [
  { kind: "fighter", label: "Guerreiro nível 5 (demo-fighter)" },
  { kind: "wizard", label: "Mago nível 5 (demo-wizard)" },
  { kind: "barbarian", label: "Bárbaro nível 5 (demo-barbarian)" },
];

function loadFighter(): void {
  const s = useCharacterStore.getState();
  s.setName("Aldric Ferroeste");
  s.setClass("guerreiro");
  s.setLevel(5);
  s.setSubclass("Campeão");
  s.setSpecies("humano");
  s.setBackground("soldado");
  s.setAbilityScore("FOR", 16);
  s.setAbilityScore("DEX", 14);
  s.setAbilityScore("CON", 14);
  s.setAbilityScore("INT", 10);
  s.setAbilityScore("SAB", 12);
  s.setAbilityScore("CAR", 8);
  s.setFeatureChoiceSelection(getClassSkillChoiceId("guerreiro"), ["atletismo", "intimidacao"]);
  s.setStartingEquipmentOption("A");
  s.setArmorEquipped("cotaDeMalha");
  s.setShield(true);
}

function loadWizard(): void {
  const s = useCharacterStore.getState();
  s.setName("Serafina Aldenar");
  s.setClass("mago");
  s.setLevel(5);
  s.setSubclass("Evocador");
  s.setSpecies("humano");
  s.setBackground("sabio");
  s.setAbilityScore("INT", 16);
  s.setAbilityScore("DEX", 14);
  s.setAbilityScore("CON", 14);
  s.setAbilityScore("FOR", 8);
  s.setAbilityScore("SAB", 12);
  s.setAbilityScore("CAR", 10);
  s.setFeatureChoiceSelection(getClassSkillChoiceId("mago"), ["arcanismo", "investigacao"]);
  s.setStartingEquipmentOption("A");
}

function loadBarbarian(): void {
  const s = useCharacterStore.getState();
  s.setName("Grokka Punhoferro");
  s.setClass("barbaro");
  s.setLevel(5);
  s.setSubclass("Caminho do Berserker");
  s.setSpecies("humano");
  s.setBackground("guarda");
  s.setAbilityScore("FOR", 16);
  s.setAbilityScore("CON", 16);
  s.setAbilityScore("DEX", 14);
  s.setAbilityScore("INT", 8);
  s.setAbilityScore("SAB", 10);
  s.setAbilityScore("CAR", 8);
  s.setFeatureChoiceSelection(getClassSkillChoiceId("barbaro"), ["atletismo", "percepcao"]);
  s.setFeatureChoiceSelection(CONHECIMENTO_PRIMORDIAL_CHOICE_ID, ["intimidacao"]);
  s.setFeatureChoiceSelection(getBarbarianWeaponMasteryChoiceId(1), "machadoGrande");
  s.setFeatureChoiceSelection(getBarbarianWeaponMasteryChoiceId(2), "azagaia");
  s.setFeatureChoiceSelection(getBarbarianWeaponMasteryChoiceId(3), "clava");
  s.setStartingEquipmentOption("A");
  // Sem armadura de propósito — demonstra a Defesa sem Armadura do Bárbaro (10 + DEX + CON), calculada automaticamente por rules/armor.ts.
}

export function loadDemoCharacter(kind: DemoCharacterKind): void {
  useCharacterStore.getState().resetCharacter();
  if (kind === "fighter") loadFighter();
  else if (kind === "wizard") loadWizard();
  else loadBarbarian();
}
