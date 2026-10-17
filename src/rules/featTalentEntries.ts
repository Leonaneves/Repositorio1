import type { AutoTextEntry, Character } from "../domain/character.js";
import {
  ALERTA_FEAT_ID,
  ARTIFISTA_FEAT_ID,
  ARTIFISTA_TOOL_CHOICE_BASE_IDS,
  ATACANTE_SELVAGEM_FEAT_ID,
  CURANDEIRO_FEAT_ID,
  ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID,
  ESPECIALISTA_BESTA_FEAT_ID,
  ESPECIALISTA_PERICIA_FEAT_ID,
  EXTERMINADOR_DE_CONJURADORES_FEAT_ID,
  HABILIDOSO_CHOICE_BASE_ID,
  HABILIDOSO_FEAT_ID,
  IMOBILIZADOR_FEAT_ID,
  INICIADO_EM_MAGIA_FEAT_ID,
  LIDER_INSPIRADOR_FEAT_ID,
  MAGIC_INITIATE_SPELL_CHOICE_BASE_ID,
  MENTE_AGUCADA_FEAT_ID,
  MESTRE_ATIRADOR_FEAT_ID,
  MESTRE_DAS_ARMAS_FEAT_ID,
  MESTRE_EM_ARMADURAS_MEDIAS_FEAT_ID,
  MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID,
  MESTRE_EM_ARMAS_DE_HASTE_FEAT_ID,
  MESTRE_EM_ARMAS_GRANDES_FEAT_ID,
  MESTRE_EM_ESCUDOS_FEAT_ID,
  MUSICO_FEAT_ID,
  MUSICO_TOOL_CHOICE_BASE_ID,
  PERFURADOR_FEAT_ID,
  RESILIENTE_FEAT_ID,
  RESISTENTE_FEAT_ID,
  SENTINELA_FEAT_ID,
  SORRATEIRO_FEAT_ID,
  SORTUDO_FEAT_ID,
  TALHADOR_FEAT_ID,
  TELECINETICO_FEAT_ID,
  TELEPATICO_FEAT_ID,
  TOCADO_PELAS_SOMBRAS_FEAT_ID,
  TOCADO_PELAS_SOMBRAS_SPELL_CHOICE_ID,
  TOCADO_POR_FADAS_FEAT_ID,
  TOCADO_POR_FADAS_SPELL_CHOICE_ID,
  TREINAMENTO_COM_ARMAS_MARCIAIS_FEAT_ID,
  VALENTAO_DE_TAVERNA_FEAT_ID,
  VELOCISTA_FEAT_ID,
  VIGOROSO_FEAT_ID,
} from "../data/features/feats.js";
import { toolsById } from "../data/tools.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";
import {
  getFeatAcquisitions,
  getFeatChoiceId,
  getGreatWeaponMasterDamageBonus,
  getHealerKitHealingBonus,
  getHeavyArmorMasterReduction,
  getInspiringLeaderTempHp,
  getLuckyPointsMax,
  getMagicInitiateList,
  getMusicianAllyCount,
  getShieldMasterCd,
  getTelekineticCd,
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

      // ===================== Talentos Gerais (26) =====================

      case ESPECIALISTA_ARMADURAS_PESADAS_FEAT_ID:
        entries.push({ text: "Especialista em Armaduras Pesadas", source: "feat" });
        break;

      case ESPECIALISTA_BESTA_FEAT_ID:
        entries.push({ text: "Especialista em Besta: ignora Recarga/mão livre; sem Desv por inimigo a 1,5m; Atq adicional Leve soma atributo ao dano", source: "feat" });
        break;

      case ESPECIALISTA_PERICIA_FEAT_ID:
        entries.push({ text: "Especialista em Perícia", source: "feat" });
        break;

      case EXTERMINADOR_DE_CONJURADORES_FEAT_ID:
        entries.push({ text: "Exterminador de Conjuradores: causar dano impõe Desv na Salv de Concent; falhou Salv INT/SAB/CAR: passa [__]/DC ou DL", source: "feat" });
        break;

      case IMOBILIZADOR_FEAT_ID:
        entries.push({
          text: "Imobilizador: 1/turno, Atq Desarmado na ação Atacar: dano+Imobilizar; Vant contra seu alvo; mover alvo do seu tamanho ou menor sem custo extra",
          source: "feat",
        });
        break;

      case LIDER_INSPIRADOR_FEAT_ID: {
        const tempHp = getInspiringLeaderTempHp(character) ?? 0;
        entries.push({ text: `Líder Inspirador: DC/DL, atuação dá ${tempHp} PV Temp a até 6 aliados a 9m, incluindo você`, source: "feat" });
        break;
      }

      case MENTE_AGUCADA_FEAT_ID:
        entries.push({ text: "Mente Aguçada: AB Analisar", source: "feat" });
        break;

      case MESTRE_DAS_ARMAS_FEAT_ID:
        entries.push({ text: "Mestre das Armas: maestria em 1 arma proficiente Simples/Marcial, troca em DL", source: "feat" });
        break;

      case MESTRE_EM_ARMADURAS_MEDIAS_FEAT_ID:
        entries.push({ text: "Mestre em Armaduras Médias", source: "feat" });
        break;

      case MESTRE_EM_ARMADURAS_PESADAS_FEAT_ID: {
        const reduction = getHeavyArmorMasterReduction(character) ?? 0;
        entries.push({ text: `Mestre em Armaduras Pesadas: com Pesada, reduz ${reduction} dano Conc/Cort/Perf de Atq`, source: "feat" });
        break;
      }

      case MESTRE_EM_ARMAS_DE_HASTE_FEAT_ID:
        entries.push({
          text: "Mestre em Armas de Haste: Cajado/Lança ou Extensão+Pesada; após Atacar, AB Atq d4 Conc; Reação: Atq em quem entra no alcance",
          source: "feat",
        });
        break;

      case MESTRE_EM_ARMAS_GRANDES_FEAT_ID: {
        const bonus = getGreatWeaponMasterDamageBonus(character) ?? 0;
        entries.push({
          text: `Mestre em Armas Grandes: ação Atacar no seu turno, acerto com Pesada +${bonus} dano; crítico/0 PV com arma corpo a corpo: AB Atq com ela`,
          source: "feat",
        });
        break;
      }

      case MESTRE_EM_ESCUDOS_FEAT_ID: {
        const cd = getShieldMasterCd(character) ?? 0;
        entries.push({
          text: `Mestre em Escudos: 1/turno, acerto corpo a corpo a 1,5m na ação Atacar: Salv FOR CD ${cd}, falha: empurra 1,5m/Caído\nReação com Escudo: passou Salv DEX para 1/2 dano, sofre 0`,
          source: "feat",
        });
        break;
      }

      case MESTRE_ATIRADOR_FEAT_ID:
        entries.push({
          text: "Mestre-Atirador: Atq à distância com arma ignora cobertura 1/2 e 3/4; armas à Distância sem Desv por inimigo a 1,5m ou alcance longo",
          source: "feat",
        });
        break;

      case PERFURADOR_FEAT_ID:
        entries.push({ text: "Perfurador: 1/turno, acerto Perf repete 1 dado de dano, usa novo; crítico Perf +1 dado", source: "feat" });
        break;

      case RESILIENTE_FEAT_ID:
        entries.push({ text: "Resiliente", source: "feat" });
        break;

      case RESISTENTE_FEAT_ID:
        entries.push({ text: "Resistente: Vant Salv Contra Morte; AB gasta Dado de PV e cura resultado", source: "feat" });
        break;

      case SENTINELA_FEAT_ID:
        entries.push({
          text: "Sentinela: Reação, Atq de Oport contra criatura a 1,5m que Desengaja/acerta outro alvo; acerto de Atq de Oport: Desl 0 até fim do turno",
          source: "feat",
        });
        break;

      case SORRATEIRO_FEAT_ID:
        entries.push({ text: "Sorrateiro: Vant Furt ao Esconder em combate; Atq escondido que erra não revela localização", source: "feat" });
        break;

      case TALHADOR_FEAT_ID:
        entries.push({
          text: "Talhador: 1/turno, acerto Cort: Desl -3m; crítico Cort: Desv nos Atq, ambos até início do prxm turno",
          source: "feat",
        });
        break;

      case TELECINETICO_FEAT_ID: {
        const cd = getTelekineticCd(character);
        if (cd === null) break;
        entries.push({ text: `Telecinético: Mãos Mágicas Invisível, alcance/distância +9m; AB alvo a 9m, Salv FOR CD ${cd}, falha: aproxima/afasta 1,5m`, source: "feat" });
        break;
      }

      case TELEPATICO_FEAT_ID:
        entries.push({ text: "Telepático: fala mental a 18m, idioma comum, sem resposta; Detectar Pensamentos [__]/DL", source: "feat" });
        break;

      case TOCADO_PELAS_SOMBRAS_FEAT_ID: {
        const chosen = character.featureChoiceSelections[getFeatChoiceId(TOCADO_PELAS_SOMBRAS_SPELL_CHOICE_ID, acquisition.acquisitionKey)]?.value;
        const chosenName = typeof chosen === "string" ? chosen.trim() : "";
        entries.push({ text: `Tocado Pelas Sombras: ${formatGrantedSpellLine("Invisibilidade", chosenName)}`, source: "feat" });
        break;
      }

      case TOCADO_POR_FADAS_FEAT_ID: {
        const chosen = character.featureChoiceSelections[getFeatChoiceId(TOCADO_POR_FADAS_SPELL_CHOICE_ID, acquisition.acquisitionKey)]?.value;
        const chosenName = typeof chosen === "string" ? chosen.trim() : "";
        entries.push({ text: `Tocado Por Fadas: ${formatGrantedSpellLine("Passo Nebuloso", chosenName)}`, source: "feat" });
        break;
      }

      case TREINAMENTO_COM_ARMAS_MARCIAIS_FEAT_ID:
        entries.push({ text: "Treinamento com Armas Marciais", source: "feat" });
        break;

      case VELOCISTA_FEAT_ID:
        entries.push({ text: "Velocista: Correr ignora custo extra de Terreno Difícil no turno; Atq de Oport contra você têm Desv", source: "feat" });
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

/**
 * Nomes resolvidos das armas concedidas por Talento (hoje só
 * Treinamento com Armas Marciais, fonte "COMPLETAR TALENTOS GERAIS NO
 * BUILDER E NO PDF" §27) para o campo "PROF.armas" do PDF — mesmo
 * princípio de `getFeatToolProficiencyEntries` (ferramentas), mas para
 * armas: entra como entrada própria, nunca sobrescrevendo o texto da
 * classe (`getClassWeaponProficiencyEntries`) nem das Maestrias/Pacto
 * já cadastrados nesse mesmo campo.
 */
export function getFeatWeaponProficiencyEntries(character: Character): AutoTextEntry[] {
  const entries: AutoTextEntry[] = [];
  for (const acquisition of getFeatAcquisitions(character)) {
    if (acquisition.featId === TREINAMENTO_COM_ARMAS_MARCIAIS_FEAT_ID) {
      entries.push({ text: "Treinamento com Armas Marciais: Armas Marciais", source: "feat" });
    }
  }
  return entries;
}

/**
 * Linha de magia concedida por Talento com marcador de uso livre por DL
 * (Tocado Pelas Sombras/Tocado Por Fadas, fonte §25/§26): magia FIXA
 * sempre com seu próprio `[__]`, seguida da magia ESCOLHIDA pelo jogador
 * (com o próprio `[__]`) só quando já preenchida — nunca um placeholder
 * `{magiaEscolhida}` literal quando o campo ainda está vazio (fonte §2:
 * "valores resolvidos, sem variáveis literais"). Um único `/DL` final,
 * compartilhado pelos dois marcadores (fonte: "O `/DL` aplica-se aos
 * dois marcadores").
 */
function formatGrantedSpellLine(fixedSpellName: string, chosenSpellName: string): string {
  if (!chosenSpellName) return `${fixedSpellName} [__]/DL`;
  return `${fixedSpellName} [__] ${chosenSpellName} [__]/DL`;
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
