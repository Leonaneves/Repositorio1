import type { AutoTextEntry, Character } from "../domain/character.js";
import {
  ALERTA_FEAT_ID,
  ARTIFISTA_FEAT_ID,
  ARTIFISTA_TOOL_CHOICE_BASE_IDS,
  ATACANTE_SELVAGEM_FEAT_ID,
  CURANDEIRO_FEAT_ID,
  HABILIDOSO_CHOICE_BASE_ID,
  HABILIDOSO_FEAT_ID,
  INICIADO_EM_MAGIA_FEAT_ID,
  MAGIC_INITIATE_SPELL_CHOICE_BASE_ID,
  MUSICO_FEAT_ID,
  MUSICO_TOOL_CHOICE_BASE_ID,
  SORTUDO_FEAT_ID,
  VALENTAO_DE_TAVERNA_FEAT_ID,
  VIGOROSO_FEAT_ID,
} from "../data/features/feats.js";
import { toolsById } from "../data/tools.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";
import {
  getFeatAcquisitions,
  getFeatChoiceId,
  getHealerKitHealingBonus,
  getLuckyPointsMax,
  getMagicInitiateList,
  getMusicianAllyCount,
  getUnarmedStrikeDamageDie,
} from "./feats.js";

/**
 * Texto compacto dos 10 Talentos de Origem para a caixa "Talentos" do
 * PDF (fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO BUILDER E NO PDF" §14) —
 * uma entrada por aquisição ATIVA (Antecedente + cada nível de ASI já
 * resolvido), na ordem em que `rules/feats.ts#getFeatAcquisitions` as
 * devolve. Habilidoso é a ÚNICA exceção: suas aquisições (possivelmente
 * repetidas) colapsam numa ÚNICA linha "Habilidoso" ou "Habilidoso
 * x{quantidade}" — nunca uma linha por aquisição. Variáveis sempre
 * resolvidas numericamente antes de retornar (nunca `{BP}` literal).
 * Nenhum benefício automático já visível em campo próprio (Iniciativa,
 * PV máximo, perícias/ferramentas da etapa Perícias) é repetido aqui.
 */
export function getFeatTalentEntries(character: Character): AutoTextEntry[] {
  const entries: AutoTextEntry[] = [];
  const acquisitions = getFeatAcquisitions(character);
  const habilidosoCount = acquisitions.filter((acquisition) => acquisition.featId === HABILIDOSO_FEAT_ID).length;
  let habilidosoPrinted = false;

  for (const acquisition of acquisitions) {
    switch (acquisition.featId) {
      case ALERTA_FEAT_ID:
        entries.push({ text: "Alerta: após jogar Inic, pode trocar com aliado voluntário, ambos sem Incapacitado", source: "feat" });
        break;

      case ARTIFISTA_FEAT_ID:
        entries.push({ text: "Artifista: 20% desconto em itens não mágicos; DL fabrica 1 item da tabela, dura até prxm DL", source: "feat" });
        break;

      case ATACANTE_SELVAGEM_FEAT_ID:
        entries.push({ text: "Atacante Selvagem: 1/turno, dano da arma 2 vezes, escolhe resultado", source: "feat" });
        break;

      case CURANDEIRO_FEAT_ID: {
        const bonus = getHealerKitHealingBonus(character) ?? 0;
        entries.push({
          text: `Curandeiro: Usar Objeto, 1 uso do kit; alvo a 1,5m gasta Dado de PV e cura dado+${bonus}\nCura por magia/este talento: pode repetir 1, usa novo resultado`,
          source: "feat",
        });
        break;
      }

      case HABILIDOSO_FEAT_ID:
        if (!habilidosoPrinted) {
          habilidosoPrinted = true;
          entries.push({ text: habilidosoCount > 1 ? `Habilidoso x${habilidosoCount}` : "Habilidoso", source: "feat" });
        }
        break;

      case INICIADO_EM_MAGIA_FEAT_ID: {
        const list = getMagicInitiateList(character, acquisition.acquisitionKey);
        const spellSelection = character.featureChoiceSelections[getFeatChoiceId(MAGIC_INITIATE_SPELL_CHOICE_BASE_ID, acquisition.acquisitionKey)]?.value;
        const spellName = typeof spellSelection === "string" ? spellSelection.trim() : "";
        if (list && spellName) {
          entries.push({ text: `Iniciado em Magia (${list}): ${spellName} sem espaço [__]/DL`, source: "feat" });
        }
        break;
      }

      case MUSICO_FEAT_ID: {
        const allies = getMusicianAllyCount(character) ?? 0;
        entries.push({ text: `Músico: DC/DL, tocar instrumento proficiente dá Inspiração Heroica a ${allies} aliados`, source: "feat" });
        break;
      }

      case SORTUDO_FEAT_ID: {
        const max = getLuckyPointsMax(character) ?? 0;
        entries.push({ text: `Sortudo: Vant em Teste de D20 ou Desv em Atq contra você ${checkboxes(max)}/DL`, source: "feat" });
        break;
      }

      case VALENTAO_DE_TAVERNA_FEAT_ID: {
        const die = getUnarmedStrikeDamageDie(character) ?? 4;
        const forModifier = getAbilityModifier(getEffectiveAbilityScore(character, "FOR"));
        entries.push({
          text: `Valentão de Taverna: dano desarmado repete 1, usa novo; 1/turno, acerto desarmado na ação Atacar empurra 1,5m\nDesarmado pode causar ${formatDieWithModifier(die, forModifier)} Conc`,
          source: "feat",
        });
        break;
      }

      case VIGOROSO_FEAT_ID:
        entries.push({ text: "Vigoroso", source: "feat" });
        break;

      default:
        break;
    }
  }

  return entries;
}

/**
 * Nomes resolvidos das Ferramentas/Instrumentos concedidos por Talento
 * (Habilidoso — metade "ferramenta" da escolha combinada; Músico — 3
 * Instrumentos Musicais; Artifista — 3 Ferramentas de Artesão, entrada
 * manual por falta de catálogo da tabela "Fabricação Rápida") para o
 * campo "PROF.ferramentas" do PDF — o único lugar onde uma proficiência
 * de ferramenta é exibida (não existe caixa de ferramentas na etapa
 * Perícias/caixa de checkboxes, diferente de perícias). Uma linha por
 * aquisição que realmente inclui ao menos 1 ferramenta — nunca uma
 * linha vazia/genérica quando a aquisição só escolheu perícias.
 */
export function getFeatToolProficiencyEntries(character: Character): AutoTextEntry[] {
  const entries: AutoTextEntry[] = [];

  for (const acquisition of getFeatAcquisitions(character)) {
    switch (acquisition.featId) {
      case HABILIDOSO_FEAT_ID: {
        const selection = character.featureChoiceSelections[getFeatChoiceId(HABILIDOSO_CHOICE_BASE_ID, acquisition.acquisitionKey)]?.value;
        const chosen = Array.isArray(selection) ? selection : [];
        const toolNames = chosen.filter((value): value is string => typeof value === "string" && value in toolsById).map((id) => toolsById[id].name);
        if (toolNames.length > 0) entries.push({ text: `Habilidoso: ${toolNames.join(", ")}`, source: "feat" });
        break;
      }

      case MUSICO_FEAT_ID: {
        const selection = character.featureChoiceSelections[getFeatChoiceId(MUSICO_TOOL_CHOICE_BASE_ID, acquisition.acquisitionKey)]?.value;
        const chosen = Array.isArray(selection) ? selection : [];
        const toolNames = chosen.filter((value): value is string => typeof value === "string" && value in toolsById).map((id) => toolsById[id].name);
        if (toolNames.length > 0) entries.push({ text: `Músico: ${toolNames.join(", ")}`, source: "feat" });
        break;
      }

      case ARTIFISTA_FEAT_ID: {
        const toolNames = ARTIFISTA_TOOL_CHOICE_BASE_IDS.map(
          (baseId) => character.featureChoiceSelections[getFeatChoiceId(baseId, acquisition.acquisitionKey)]?.value,
        )
          .filter((value): value is string => typeof value === "string" && value.trim() !== "")
          .map((value) => value.trim());
        if (toolNames.length > 0) entries.push({ text: `Artifista: ${toolNames.join(", ")}`, source: "feat" });
        break;
      }

      default:
        break;
    }
  }

  return entries;
}

/** `[__]` repetido `count` vezes, separados por espaço — ex.: Sortudo com BP 3 = `[__] [__] [__]`. */
function checkboxes(count: number): string {
  return Array.from({ length: Math.max(0, count) }, () => "[__]").join(" ");
}

/** `1d{die}` + modificador formatado — `+N`/`-N` quando diferente de zero, só `1d{die}` quando zero. */
function formatDieWithModifier(die: number, modifier: number): string {
  if (modifier > 0) return `1d${die}+${modifier}`;
  if (modifier < 0) return `1d${die}${modifier}`;
  return `1d${die}`;
}
