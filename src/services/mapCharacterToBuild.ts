import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import type { CharacterBuild } from "../domain/characterBuild.js";
import { SKILL_KEYS } from "../domain/ids.js";
import { getSpellcastingAbility } from "../rules/spellcasting.js";
import { getSkillProficiency } from "../rules/skills.js";
import { getRecordedTalentAcquisitions } from "../rules/talentAcquisitionHistory.js";
import { getSkillChoiceFeatures } from "../rules/features.js";
import type { SkillKey } from "../domain/ids.js";

/** Seleções de cada escolha de perícia/Especialização, pelo id da `FeatureChoice` — só as já feitas (lista não vazia). */
function getSkillChoiceSelections(character: Character): Record<string, SkillKey[]> {
  const selections: Record<string, SkillKey[]> = {};
  for (const feature of getSkillChoiceFeatures(character)) {
    for (const choice of feature.choices ?? []) {
      if (choice.effect.kind !== "skillProficiency" && choice.effect.kind !== "skillExpertise") continue;
      const value = character.featureChoiceSelections[choice.id]?.value;
      if (Array.isArray(value) && value.length > 0) selections[choice.id] = value.filter((skill): skill is SkillKey => (SKILL_KEYS as readonly string[]).includes(skill));
    }
  }
  return selections;
}

/**
 * Converte o personagem em edição (estado completo, incluindo tudo o
 * que é pessoal/texto livre) na representação anônima e estruturada
 * usada para estatísticas (`CharacterBuild`).
 *
 * Campos do `Character` que NUNCA são copiados para o build, de
 * propósito (lista negativa explícita, para deixar claro na leitura do
 * código o que fica de fora — ver §7 do pedido do usuário):
 *
 * - `name` — nunca. `id` só entra como `characterId` (UUID gerado no
 *   navegador sem qualquer vínculo com identidade real).
 * - `weaponProficienciesNotes`, `toolProficienciesNotes`,
 *   `speciesTraitsNotes`, `talentsNotes`, `classFeatures`, `appearance`,
 *   `languages` — texto livre escrito pelo jogador.
 * - `attacks`, `spellsPrepared`, `inventory` — texto livre / dados de
 *   jogo em mesa, não são escolhas de criação de personagem.
 * - `hp`, `deathSaves`, `heroicInspiration` — estado de jogo, não
 *   escolha de criação.
 * - Qualquer ajuste manual (`manualAdjustment`, `manualOverride`,
 *   `manualSaveDCAdjustment` etc.) — são idiossincrasias da mesa/ajustes
 *   pontuais, não escolhas de criação que fazem sentido agregar.
 * - Nenhum dado de rede (IP, user agent, cookies) é coletado por este
 *   mapeador nem em nenhum outro ponto do sistema.
 *
 * `origin` é sempre `"user"` aqui — este mapeador só processa
 * personagens reais em edição; registros de referência importados de
 * fontes externas (fonte "IMPLEMENTAR A BASE DE DADOS PARA FUTURAS
 * RECOMENDAÇÕES" §2) nunca passam por aqui, são gravados por um
 * caminho próprio (importação futura). `status` começa sempre
 * `"draft"` — nunca presumido confirmado só por este mapeamento;
 * só `services/publishConfirmedCharacter.ts` grava, e sempre como
 * `"confirmed"`, depois da ação explícita do jogador.
 */
export function mapCharacterToBuild(character: Character, updatedAt: string = new Date().toISOString()): CharacterBuild {
  const abilityScores = Object.fromEntries(ABILITY_KEYS.map((key) => [key, character.abilities[key].score])) as Record<
    AbilityKey,
    number
  >;

  const skillProficiencies = SKILL_KEYS.filter((skill) => getSkillProficiency(character, skill));
  const skillExpertise = SKILL_KEYS.filter((skill) => character.skills[skill].expertise);
  const savingThrowProficiencies = ABILITY_KEYS.filter((ability) => character.savingThrows[ability].proficient);

  return {
    // Placeholder determinístico — `services/publishConfirmedCharacter.ts` troca por um id novo a cada confirmação.
    buildId: character.id,
    characterId: character.id,
    origin: "user",
    status: "draft",
    referenceSource: null,
    level: character.level,
    classId: character.classId,
    subclassId: character.subclassId,
    speciesId: character.speciesId,
    backgroundId: character.backgroundId,
    abilityScores,
    skillProficiencies,
    skillExpertise,
    skillChoices: getSkillChoiceSelections(character),
    savingThrowProficiencies,
    armorId: character.armor.equipped === "unarmed" ? null : character.armor.equipped,
    shield: character.armor.shield,
    spellcastingAbility: getSpellcastingAbility(character),
    talentAcquisitions: getRecordedTalentAcquisitions(character),
    updatedAt,
  };
}
