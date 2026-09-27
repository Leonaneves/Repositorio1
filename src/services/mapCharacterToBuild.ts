import { ABILITY_KEYS, type AbilityKey } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import type { CharacterBuild } from "../domain/characterBuild.js";
import { SKILL_KEYS } from "../domain/ids.js";
import { getSpellcastingAbility } from "../rules/spellcasting.js";
import { getSkillProficiency } from "../rules/skills.js";

/**
 * Converte o personagem em edição (estado completo, incluindo tudo o
 * que é pessoal/texto livre) na representação anônima e estruturada
 * usada para estatísticas (`CharacterBuild`).
 *
 * Campos do `Character` que NUNCA são copiados para o build, de
 * propósito (lista negativa explícita, para deixar claro na leitura do
 * código o que fica de fora — ver §7 do pedido do usuário):
 *
 * - `id` / `name` — usa-se só `buildId` (o próprio `id`, que já é um
 *   UUID gerado no navegador sem qualquer vínculo com identidade real).
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
    buildId: character.id,
    level: character.level,
    classId: character.classId,
    subclassId: character.subclassId,
    speciesId: character.speciesId,
    backgroundId: character.backgroundId,
    abilityScores,
    skillProficiencies,
    skillExpertise,
    savingThrowProficiencies,
    armorId: character.armor.equipped === "unarmed" ? null : character.armor.equipped,
    shield: character.armor.shield,
    spellcastingAbility: getSpellcastingAbility(character),
    updatedAt,
  };
}
