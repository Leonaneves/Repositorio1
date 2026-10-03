import type { AbilityKey } from "../domain/common.js";
import type { Character } from "../domain/character.js";
import { SKILL_KEYS, SPELL_CIRCLES, type SkillKey, type SpellCircle } from "../domain/ids.js";
import { armors } from "../data/armors.js";
import {
  getAbilityModifier,
  getEffectiveAbilityScore,
  getProficiencyBonus,
  getArmorClass,
  getInitiative,
  getPassivePerception,
  getSavingThrow,
  getSize,
  getSkillBonus,
  getSpeed,
  getSpellAttackBonus,
  getSpellcastingAbility,
  getSpellcastingModifier,
  getSpellSaveDC,
  getMaxHitDice,
  getMaxHitPoints,
} from "../rules/index.js";
import {
  getBackgroundFeatEntries,
  getClassToolProficiencyEntries,
  getClassWeaponProficiencyEntries,
  getSpeciesTraitEntries,
  renderAutoTextBlock,
} from "../rules/proficiencyText.js";
import { getSkillProficiency } from "../rules/skills.js";
import { getBarbarianPrintedBlocks } from "../rules/barbarianPrintedFeatures.js";
import { getBarbarianWeaponMasteryEntries } from "../rules/barbarianWeaponMastery.js";
import { getBarbarianRitualSpells } from "../rules/barbarianRitualSpells.js";
import { getBardPrintedBlocks } from "../rules/bardPrintedFeatures.js";
import { getBardWeaponProficiencyEntries } from "../rules/bardSubclassProficiencies.js";
import { getBardAutoPreparedSpells } from "../rules/bardAutoPreparedSpells.js";
import { getClericPrintedBlocks } from "../rules/clericPrintedFeatures.js";
import { getClericWeaponProficiencyEntries } from "../rules/clericProficiencies.js";
import { getClericAutoPreparedSpells } from "../rules/clericAutoPreparedSpells.js";
import { getDruidPrintedBlocks } from "../rules/druidPrintedFeatures.js";
import { getDruidWeaponProficiencyEntries } from "../rules/druidProficiencies.js";
import { getDruidAutoPreparedSpells } from "../rules/druidAutoPreparedSpells.js";
import { getWarlockPrintedBlocks } from "../rules/warlockPrintedFeatures.js";
import { getWarlockAutoPreparedSpells } from "../rules/warlockAutoPreparedSpells.js";
import { getWarlockPactWeaponProficiencyEntries } from "../rules/warlockPactWeapon.js";
import { getWarlockLessonsOfTheOldOnesTalentEntries } from "../rules/warlockTalentEntries.js";
import { formatComputedPlain, formatComputedSigned, formatPlain, formatSigned, truncate } from "./formatter.js";

/**
 * Abreviação de cada perícia no PDF-molde (`<ATRIBUTO>.<abrev>`),
 * extraída literalmente de `docs/referencia/campos-completos.json` —
 * é a mesma convenção documentada em `data/skills.ts`.
 */
const SKILL_FIELD_SUFFIX: Record<SkillKey, string> = {
  atletismo: "FOR.atl",
  acrobacia: "DEX.acr",
  furtividade: "DEX.fur",
  prestidigitacao: "DEX.pre",
  arcanismo: "INT.arc",
  historia: "INT.hist",
  investigacao: "INT.inv",
  natureza: "INT.nat",
  religiao: "INT.rel",
  intuicao: "SAB.int",
  lidarComAnimais: "SAB.lidar",
  medicina: "SAB.med",
  percepcao: "SAB.perc",
  sobrevivencia: "SAB.sob",
  atuacao: "CAR.atu",
  enganacao: "CAR.eng",
  intimidacao: "CAR.inti",
  persuasao: "CAR.pers",
};

const ABILITY_NAMES: Record<AbilityKey, string> = {
  FOR: "Força",
  DEX: "Destreza",
  CON: "Constituição",
  INT: "Inteligência",
  SAB: "Sabedoria",
  CAR: "Carisma",
};

const ABILITY_ORDER: AbilityKey[] = ["FOR", "DEX", "CON", "INT", "SAB", "CAR"];

function formatArmorLabel(character: Character): string {
  const label = character.armor.equipped === "unarmed" ? "Sem Armadura" : armors[character.armor.equipped].name;
  return character.armor.shield ? `${label} + Escudo` : label;
}

export interface PdfTextFieldMapping {
  kind: "text";
  /** Nome exato do campo no AcroForm (case- e espaço-sensível — ex.: "Nome " tem um espaço à direita no PDF-molde). */
  pdfField: string;
  getValue: (character: Character) => string;
}

export interface PdfDropdownFieldMapping {
  kind: "dropdown";
  pdfField: string;
  /** Precisa bater exatamente com uma das opções gravadas no PDF-molde. `null` deixa sem selecionar ("- Selecione -"). */
  getValue: (character: Character) => string | null;
}

/**
 * Exceção aprovada (decisão 1 da arquitetura): SUBCLASSE e
 * ARMADURA.ATUAL são campos de escolha (`/FT choice`) sem lista de
 * opções gravada no PDF — a Acrobat injeta as opções em tempo real via
 * JavaScript, que não roda no exportador. Em vez de tentar selecionar
 * uma opção inexistente, o exportador remove esses dois campos do
 * AcroForm e desenha o texto diretamente nas coordenadas do campo
 * (`rect`, em pontos PDF, extraído de `campos-completos.json`).
 */
export interface PdfOverlayFieldMapping {
  kind: "overlay";
  pdfField: string;
  /** Índice da página (0-based) onde o campo está no PDF-molde. */
  pageIndex: number;
  rect: [number, number, number, number];
  getValue: (character: Character) => string;
}

/**
 * Checkbox simples (todos os 163 do molde usam o mesmo par de estados
 * — /Sim ligado, /Off desligado — ver
 * `docs/referencia/pdf-exportacao/checkboxes-diagnostico.md`). O
 * exportador nunca hardcoda esse valor: `pdf-lib` já lê o estado
 * "ligado" real do próprio dicionário de aparência do campo
 * (`form.getCheckBox(nome).check()`), então `getValue` só precisa
 * devolver `true`/`false`.
 */
export interface PdfCheckboxFieldMapping {
  kind: "checkbox";
  pdfField: string;
  getValue: (character: Character) => boolean;
}

export type PdfFieldMapping = PdfTextFieldMapping | PdfDropdownFieldMapping | PdfOverlayFieldMapping | PdfCheckboxFieldMapping;

export const pdfDropdownFields: PdfDropdownFieldMapping[] = [
  { kind: "dropdown", pdfField: "CLASSE", getValue: (c) => (c.classId ? classDisplayName(c) : null) },
  { kind: "dropdown", pdfField: "ESPECIE", getValue: (c) => (c.speciesId ? speciesDisplayName(c) : null) },
  { kind: "dropdown", pdfField: "ANTECEDENTE", getValue: (c) => (c.backgroundId ? backgroundDisplayName(c) : null) },
];

// As 3 funções abaixo importam os próprios dados só quando chamadas, para manter os imports do topo focados nas regras.
import { classes } from "../data/classes.js";
import { species } from "../data/species.js";
import { backgrounds } from "../data/backgrounds.js";

function classDisplayName(character: Character): string | null {
  return character.classId ? classes[character.classId].name : null;
}
function speciesDisplayName(character: Character): string | null {
  return character.speciesId ? species[character.speciesId].name : null;
}
function backgroundDisplayName(character: Character): string | null {
  return character.backgroundId ? backgrounds[character.backgroundId].name : null;
}

export const pdfOverlayFields: PdfOverlayFieldMapping[] = [
  {
    kind: "overlay",
    pdfField: "SUBCLASSE",
    pageIndex: 0,
    rect: [146.618, 769.593, 252.982, 784.32],
    getValue: (c) => (c.subclassId ? truncate(c.subclassId, 30) : ""),
  },
  {
    kind: "overlay",
    pdfField: "ARMADURA.ATUAL",
    pageIndex: 1,
    rect: [405.817, 529.484, 580.362, 552.612],
    getValue: (c) => formatArmorLabel(c),
  },
];

const identityAndDerived: PdfTextFieldMapping[] = [
  { kind: "text", pdfField: "Nome ", getValue: (c) => c.name },
  { kind: "text", pdfField: "Nível", getValue: (c) => formatPlain(c.level) },
  { kind: "text", pdfField: "CA", getValue: (c) => formatComputedPlain(getArmorClass(c)) },
  { kind: "text", pdfField: "PROFICIENCIA", getValue: (c) => formatSigned(getProficiencyBonus(c.level)) },
  { kind: "text", pdfField: "Iniciativa", getValue: (c) => formatComputedSigned(getInitiative(c)) },
  { kind: "text", pdfField: "Deslocamento", getValue: (c) => formatComputedPlain(getSpeed(c)) },
  { kind: "text", pdfField: "Tamanho", getValue: (c) => getSize(c).total ?? "" },
  { kind: "text", pdfField: "PERCEPCAO.PASSIVA", getValue: (c) => formatComputedPlain(getPassivePerception(c)) },
  { kind: "text", pdfField: "HP.atual", getValue: (c) => formatPlain(c.hp.current) },
  { kind: "text", pdfField: "HP.temp", getValue: (c) => formatPlain(c.hp.temp) },
  { kind: "text", pdfField: "HP.max", getValue: (c) => formatComputedPlain(getMaxHitPoints(c)) },
  { kind: "text", pdfField: "HP.Dados.Gasto", getValue: (c) => formatPlain(c.hp.hitDiceSpent) },
  { kind: "text", pdfField: "HP.Dados.max", getValue: (c) => formatPlain(getMaxHitDice(c)) },
];

const abilityFields: PdfTextFieldMapping[] = ABILITY_ORDER.flatMap((ability) => [
  { kind: "text" as const, pdfField: `${ability}.val`, getValue: (c: Character) => formatPlain(getEffectiveAbilityScore(c, ability)) },
  {
    kind: "text" as const,
    pdfField: `${ability}.MOD`,
    getValue: (c: Character) => formatSigned(getAbilityModifier(getEffectiveAbilityScore(c, ability))),
  },
  { kind: "text" as const, pdfField: `${ability}.res`, getValue: (c: Character) => formatComputedSigned(getSavingThrow(c, ability)) },
]);

const skillFields: PdfTextFieldMapping[] = SKILL_KEYS.map((skillKey) => ({
  kind: "text" as const,
  pdfField: SKILL_FIELD_SUFFIX[skillKey],
  getValue: (c: Character) => formatComputedSigned(getSkillBonus(c, skillKey)),
}));

/**
 * Distribui blocos de texto em 2 colunas, sempre no bloco mais curto
 * até agora — simples e genérico o bastante para reaproveitar quando
 * outras classes ganharem texto impresso dinâmico (hoje só o Bárbaro).
 */
function splitIntoTwoColumns(blocks: string[]): [string, string] {
  const columns: [string[], string[]] = [[], []];
  const lengths = [0, 0];
  for (const block of blocks) {
    const shorter = lengths[0] <= lengths[1] ? 0 : 1;
    columns[shorter].push(block);
    lengths[shorter] += block.length;
  }
  return [columns[0].join("\n\n"), columns[1].join("\n\n")];
}

/**
 * "Características de Classe" (`Carac.Classe.1`/`.2`) — por ora Bárbaro
 * (fonte "INTEGRAÇÃO COMPLETA — BÁRBARO E SUBCLASSES"), Bardo (fonte
 * "INTEGRAÇÃO COMPLETA — BARDO E SUBCLASSES"), Bruxo (fonte
 * "INTEGRAÇÃO COMPLETA — BRUXO, INVOCAÇÕES MÍSTICAS E SUBCLASSES"),
 * Clérigo (fonte "INTEGRAÇÃO COMPLETA — CLÉRIGO E SUBCLASSES") e
 * Druida (fonte "INTEGRAÇÃO COMPLETA — DRUIDA E SUBCLASSES") têm o
 * texto impresso montado dinamicamente; as demais 8 classes continuam
 * com o campo manual de sempre (`Character.classFeatures`), sem
 * nenhuma mudança de comportamento.
 */
function getClassFeaturesColumn(character: Character, column: 1 | 2): string {
  if (character.classId === "barbaro") {
    const [column1, column2] = splitIntoTwoColumns(getBarbarianPrintedBlocks(character));
    return column === 1 ? column1 : column2;
  }
  if (character.classId === "bardo") {
    const [column1, column2] = splitIntoTwoColumns(getBardPrintedBlocks(character));
    return column === 1 ? column1 : column2;
  }
  if (character.classId === "bruxo") {
    const [column1, column2] = splitIntoTwoColumns(getWarlockPrintedBlocks(character));
    return column === 1 ? column1 : column2;
  }
  if (character.classId === "clerigo") {
    const [column1, column2] = splitIntoTwoColumns(getClericPrintedBlocks(character));
    return column === 1 ? column1 : column2;
  }
  if (character.classId === "druida") {
    const [column1, column2] = splitIntoTwoColumns(getDruidPrintedBlocks(character));
    return column === 1 ? column1 : column2;
  }
  return column === 1 ? character.classFeatures.column1 : character.classFeatures.column2;
}

const proficiencyTextFields: PdfTextFieldMapping[] = [
  {
    kind: "text",
    pdfField: "PROF.armas",
    getValue: (c) =>
      renderAutoTextBlock(
        [
          ...getClassWeaponProficiencyEntries(c),
          ...getBarbarianWeaponMasteryEntries(c),
          ...getBardWeaponProficiencyEntries(c),
          ...getClericWeaponProficiencyEntries(c),
          ...getDruidWeaponProficiencyEntries(c),
          ...getWarlockPactWeaponProficiencyEntries(c),
        ],
        c.weaponProficienciesNotes,
      ),
  },
  {
    kind: "text",
    pdfField: "PROF.ferramentas",
    getValue: (c) => renderAutoTextBlock(getClassToolProficiencyEntries(c), c.toolProficienciesNotes),
  },
  {
    kind: "text",
    pdfField: "HABILIDADES.ESPECIE",
    getValue: (c) => renderAutoTextBlock(getSpeciesTraitEntries(c), c.speciesTraitsNotes),
  },
  {
    kind: "text",
    pdfField: "Talentos",
    getValue: (c) => renderAutoTextBlock([...getBackgroundFeatEntries(c), ...getWarlockLessonsOfTheOldOnesTalentEntries(c)], c.talentsNotes),
  },
  { kind: "text", pdfField: "Carac.Classe.1", getValue: (c) => getClassFeaturesColumn(c, 1) },
  { kind: "text", pdfField: "Carac.Classe.2", getValue: (c) => getClassFeaturesColumn(c, 2) },
];

const spellcastingStatFields: PdfTextFieldMapping[] = [
  { kind: "text", pdfField: "ATRIBUTO.conju", getValue: (c) => (getSpellcastingAbility(c) ? ABILITY_NAMES[getSpellcastingAbility(c) as AbilityKey] : "") },
  { kind: "text", pdfField: "MOD.magia", getValue: (c) => (getSpellcastingModifier(c) !== null ? formatSigned(getSpellcastingModifier(c) as number) : "") },
  { kind: "text", pdfField: "CD.magia", getValue: (c) => { const dc = getSpellSaveDC(c); return dc ? formatComputedPlain(dc) : ""; } },
  { kind: "text", pdfField: "MOD.CONJ", getValue: (c) => { const atk = getSpellAttackBonus(c); return atk ? formatComputedSigned(atk) : ""; } },
];

/** Até 6 linhas de ataque manual (`Arma.TruqueN`/`Bonus de atk N`/`Dano e Tipo N`/`Notas da Arma N`) — limite do PDF-molde. */
const MAX_ATTACK_ROWS = 6;
function attackFieldSuffix(row: number): string {
  return row === 0 ? "" : ` ${row}`;
}
const attackFields: PdfTextFieldMapping[] = Array.from({ length: MAX_ATTACK_ROWS }, (_, row) => {
  const nameField = row === 0 ? "Arma.Truque" : `Arma.Truque${row + 1}`;
  const suffix = attackFieldSuffix(row);
  return [
    { kind: "text" as const, pdfField: nameField, getValue: (c: Character) => c.attacks[row]?.name ?? "" },
    { kind: "text" as const, pdfField: `Bonus de atk${suffix}`, getValue: (c: Character) => c.attacks[row]?.attackBonus ?? "" },
    { kind: "text" as const, pdfField: `Dano e Tipo${suffix}`, getValue: (c: Character) => c.attacks[row]?.damage ?? "" },
    { kind: "text" as const, pdfField: `Notas da Arma${suffix}`, getValue: (c: Character) => c.attacks[row]?.notes ?? "" },
  ];
}).flat();

/** Até 3 itens sintonizados — o PDF-molde só reserva 3 linhas (Item.magico.1–3). */
const attunedItemFields: PdfTextFieldMapping[] = [1, 2, 3].map((n) => ({
  kind: "text" as const,
  pdfField: `Item.magico.${n}`,
  getValue: (c: Character) => c.inventory.attunedItems[n - 1]?.description ?? "",
}));

const inventoryFields: PdfTextFieldMapping[] = [
  { kind: "text", pdfField: "Equipamentos", getValue: (c) => c.inventory.equipment },
  { kind: "text", pdfField: "cobre", getValue: (c) => formatPlain(c.inventory.coins.cp) },
  { kind: "text", pdfField: "prata", getValue: (c) => formatPlain(c.inventory.coins.sp) },
  { kind: "text", pdfField: "ouro", getValue: (c) => formatPlain(c.inventory.coins.gp) },
  { kind: "text", pdfField: "platina", getValue: (c) => formatPlain(c.inventory.coins.pp) },
  ...attunedItemFields,
  { kind: "text", pdfField: "aparência", getValue: (c) => c.appearance },
  { kind: "text", pdfField: "idiomas", getValue: (c) => getEffectiveLanguages(c) },
];

/**
 * Idioma Druídico (Druida, nível 1 — fonte "INTEGRAÇÃO COMPLETA —
 * DRUIDA E SUBCLASSES" §3) adiciona "Druídico" à área de Idiomas
 * automaticamente — mesmo padrão de `renderAutoTextBlock`, mas para um
 * campo de uma linha só (idiomas são separados por vírgula, não por
 * parágrafo): nunca duplica se o jogador já tiver digitado "Druídico"
 * manualmente.
 */
function getEffectiveLanguages(character: Character): string {
  if (character.classId !== "druida") return character.languages;
  if (character.languages.toLowerCase().includes("druídico")) return character.languages;
  return character.languages.trim() ? `Druídico, ${character.languages}` : "Druídico";
}

/**
 * Lista efetiva de magias preparadas para o PDF: magias concedidas
 * automaticamente por subclasse/classe (Arauto da Fauna/Natureza do
 * Caminho do Coração Selvagem — `getBarbarianRitualSpells`; Magia
 * Fascinante/Manto de Majestade do Colégio do Glamour e Palavras de
 * Criação do Bardo base — `getBardAutoPreparedSpells`; Magias de
 * Domínio das 4 subclasses + Truque extra de Taumaturgo do Clérigo —
 * `getClericAutoPreparedSpells`; Falar com Animais/Convocar Familiar/
 * Magias de Círculo/Mapa Estelar/Truque de Xamã do Druida —
 * `getDruidAutoPreparedSpells`; magias sempre preparadas dos 4
 * Patronos + Contatar Patrono + invocações que concedem magia do Bruxo
 * — `getWarlockAutoPreparedSpells`) primeiro, seguidas da lista manual
 * do jogador. Nunca grava as auto-concedidas
 * de volta em `character.spellsPrepared` — só compõe no momento da
 * exportação, igual ao padrão já usado para texto automático em
 * `rules/proficiencyText.ts`.
 */
function getEffectiveSpellsPrepared(character: Character) {
  return [
    ...getBarbarianRitualSpells(character),
    ...getBardAutoPreparedSpells(character),
    ...getClericAutoPreparedSpells(character),
    ...getDruidAutoPreparedSpells(character),
    ...getWarlockAutoPreparedSpells(character),
    ...character.spellsPrepared,
  ];
}

/** Até 34 magias preparadas — o PDF-molde reserva essas 34 linhas (`circulo1.N`/`nome.magia.1.N`/`alcance.magia.N`/`notas.magia.1.N`). */
const MAX_SPELL_ROWS = 34;
const spellPreparedFields: PdfTextFieldMapping[] = Array.from({ length: MAX_SPELL_ROWS }, (_, i) => [
  { kind: "text" as const, pdfField: `circulo1.${i}`, getValue: (c: Character) => getEffectiveSpellsPrepared(c)[i]?.circle ?? "" },
  { kind: "text" as const, pdfField: `nome.magia.1.${i}`, getValue: (c: Character) => getEffectiveSpellsPrepared(c)[i]?.name ?? "" },
  { kind: "text" as const, pdfField: `alcance.magia.${i}`, getValue: (c: Character) => getEffectiveSpellsPrepared(c)[i]?.range ?? "" },
  { kind: "text" as const, pdfField: `notas.magia.1.${i}`, getValue: (c: Character) => getEffectiveSpellsPrepared(c)[i]?.notes ?? "" },
]).flat();

/**
 * Mapeamento completo de campos de TEXTO simples — cobre identidade,
 * atributos/perícias/salvaguardas, PV/CA/Dados de Vida, textos
 * automáticos de proficiência, conjuração, ataques, inventário e
 * magias preparadas. NÃO inclui os 4 campos ocultos `AUTO.*` (usados só
 * pelo JavaScript do PDF original para diffing interno — nunca
 * visíveis, não precisam de valor no export estático).
 */
export const pdfTextFields: PdfTextFieldMapping[] = [
  ...identityAndDerived,
  ...abilityFields,
  ...skillFields,
  ...proficiencyTextFields,
  ...spellcastingStatFields,
  ...attackFields,
  ...inventoryFields,
  ...spellPreparedFields,
];

/** Nome do checkbox de proficiência da perícia — "o.INT.arc" é a única exceção com "o" minúsculo (mesma inconsistência já documentada em data/skills.ts). */
function skillProficiencyCheckboxField(skillKey: SkillKey): string {
  if (skillKey === "arcanismo") return "o.INT.arc";
  return `O.${SKILL_FIELD_SUFFIX[skillKey]}`;
}

const skillProficiencyCheckboxes: PdfCheckboxFieldMapping[] = SKILL_KEYS.map((skillKey) => ({
  kind: "checkbox",
  pdfField: skillProficiencyCheckboxField(skillKey),
  getValue: (c) => getSkillProficiency(c, skillKey),
}));

const saveProficiencyCheckboxes: PdfCheckboxFieldMapping[] = ABILITY_ORDER.map((ability) => ({
  kind: "checkbox",
  pdfField: `O.${ability}.res`,
  getValue: (c) => c.savingThrows[ability].proficient,
}));

/** Cada caixa marca "pelo menos N" sucessos/falhas — leitura visual padrão de salvaguarda contra morte (caixas preenchidas da esquerda pra direita). */
const deathSaveCheckboxes: PdfCheckboxFieldMapping[] = [1, 2, 3].flatMap((n) => [
  { kind: "checkbox" as const, pdfField: `Morte.suc.${n}`, getValue: (c: Character) => c.deathSaves.successes >= n },
  { kind: "checkbox" as const, pdfField: `Morte.fal.${n}`, getValue: (c: Character) => c.deathSaves.failures >= n },
]);

const armorTrainingCheckboxes: PdfCheckboxFieldMapping[] = [
  { kind: "checkbox", pdfField: "PROF.leve", getValue: (c) => c.armor.proficiencies.light },
  { kind: "checkbox", pdfField: "PROF.med", getValue: (c) => c.armor.proficiencies.medium },
  { kind: "checkbox", pdfField: "PROF.pesa", getValue: (c) => c.armor.proficiencies.heavy },
  { kind: "checkbox", pdfField: "PROF.Escudo", getValue: (c) => c.armor.proficiencies.shield },
  { kind: "checkbox", pdfField: "Escudo", getValue: (c) => c.armor.shield },
];

/** Até 3 itens sintonizados — mesmo limite/índice de `attunedItemFields` (texto) acima. */
const attunedItemCheckboxes: PdfCheckboxFieldMapping[] = [1, 2, 3].map((n) => ({
  kind: "checkbox" as const,
  pdfField: `O.item.magico.${n}`,
  getValue: (c: Character) => c.inventory.attunedItems[n - 1]?.attuned ?? false,
}));

/** Quantidade real de caixas de espaço de magia por círculo no molde (`Nº.circ.M`) — 1º tem 4, 6º–9º têm menos. */
const SPELL_SLOT_BOX_COUNT: Record<SpellCircle, number> = { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 };

/** Cada caixa marca "pelo menos M espaços gastos" — mesma leitura cumulativa das salvaguardas contra morte. */
const spellSlotExpendedCheckboxes: PdfCheckboxFieldMapping[] = SPELL_CIRCLES.flatMap((circle) =>
  Array.from({ length: SPELL_SLOT_BOX_COUNT[circle] }, (_, i) => {
    const boxNumber = i + 1;
    return {
      kind: "checkbox" as const,
      pdfField: `${circle}o.circ.${boxNumber}`,
      getValue: (c: Character) => c.spellcasting.slots[circle].expended >= boxNumber,
    };
  }),
);

/**
 * `C5` — Inspiração Heroica (`Character.heroicInspiration`). Mapeado
 * semanticamente (identificado visualmente na ficha impressa), mas
 * **sem escrita nesta fase** — decisão explícita, não pendência
 * técnica: Inspiração Heroica só fica realmente útil numa Ficha Web
 * futura, usada durante a sessão, com o jogador marcando/desmarcando
 * em tempo real (não faz sentido "imprimir" um estado que muda a cada
 * cena de jogo). Por isso fica documentado aqui, exportado à parte,
 * mas de propósito FORA de `pdfCheckboxFields` — o exportador nunca o
 * escreve. Não se tenta corrigir a anomalia de aparência do campo (só
 * tem estado `/Sim`, sem `/Off`) agora, já que ele não é escrito.
 */
export const heroicInspirationCheckboxField: PdfCheckboxFieldMapping = {
  kind: "checkbox",
  pdfField: "C5",
  getValue: (c: Character) => c.heroicInspiration,
};

/**
 * Checkboxes implementados nesta etapa (diagnóstico completo em
 * `docs/referencia/pdf-exportacao/checkboxes-diagnostico.md`):
 * proficiência de perícia/salvaguarda, salvaguardas contra morte,
 * treinamento de armadura, escudo equipado, itens mágicos
 * sintonizados, espaços de magia gastos por círculo. Ainda NÃO
 * implementado (o `Character` não tem metadado estruturado de
 * Concentração/Ritual/Material por magia enquanto `spellsPrepared`
 * for entrada manual — ver `data/spells/`): Concentração/Ritual/
 * Material das 34 linhas de magia preparada. `C5`/Inspiração Heroica
 * fica de fora de propósito (ver `heroicInspirationCheckboxField`).
 */
export const pdfCheckboxFields: PdfCheckboxFieldMapping[] = [
  ...skillProficiencyCheckboxes,
  ...saveProficiencyCheckboxes,
  ...deathSaveCheckboxes,
  ...armorTrainingCheckboxes,
  ...attunedItemCheckboxes,
  ...spellSlotExpendedCheckboxes,
];
