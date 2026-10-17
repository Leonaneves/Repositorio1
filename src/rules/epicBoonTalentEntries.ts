import type { AutoTextEntry, Character } from "../domain/character.js";
import {
  DADIVA_DA_FORTITUDE_FEAT_ID,
  DADIVA_DA_PROEZA_EM_COMBATE_FEAT_ID,
  DADIVA_DA_PROFICIENCIA_EM_PERICIA_FEAT_ID,
  DADIVA_DA_RECORDACAO_DE_MAGIA_FEAT_ID,
  DADIVA_DA_RECUPERACAO_FEAT_ID,
  DADIVA_DA_RESISTENCIA_A_ENERGIA_FEAT_ID,
  DADIVA_DA_VELOCIDADE_FEAT_ID,
  DADIVA_DA_VIAGEM_DIMENSIONAL_FEAT_ID,
  DADIVA_DA_VISAO_VERDADEIRA_FEAT_ID,
  DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID,
  DADIVA_DO_DESTINO_FEAT_ID,
  DADIVA_DO_ESPIRITO_DA_NOITE_FEAT_ID,
} from "../data/features/epicBoons.js";
import {
  getChosenEpicBoonId,
  getEpicBoonEnergyRedirectCd,
  getEpicBoonEnergyRedirectDamage,
  getEpicBoonFortitudeHealBonus,
  getEpicBoonIrresistibleAttackValue,
  getEpicBoonRecoveryHalfMaxHp,
} from "./epicBoons.js";

/** `+N`/`-N` — nunca `+-N` (fonte "IMPLEMENTAR TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF" §3: "Formatar corretamente modificadores negativos"). */
function formatSignedModifier(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

/** `[__]` repetido `count` vezes, separados por espaço. */
function checkboxes(count: number): string {
  return Array.from({ length: Math.max(0, count) }, () => "[__]").join(" ");
}

/**
 * Texto compacto da Dádiva Épica ATIVA para a caixa "Talentos" do PDF
 * (fonte "IMPLEMENTAR TALENTOS DE DÁDIVA ÉPICA NO BUILDER E NO PDF" §2)
 * — no máximo UMA entrada (nunca mais de uma Dádiva Épica ativa por
 * personagem). Benefícios já representados em campo próprio (PV máximo
 * da Dádiva da Fortitude, Deslocamento da Dádiva da Velocidade, o
 * atributo aumentado por qualquer uma das 12, a Especialização da
 * Dádiva da Proficiência em Perícia) NUNCA são repetidos aqui. Variáveis
 * sempre resolvidas numericamente antes de retornar.
 */
export function getEpicBoonTalentEntries(character: Character): AutoTextEntry[] {
  const id = getChosenEpicBoonId(character);
  if (!id) return [];

  switch (id) {
    case DADIVA_DA_FORTITUDE_FEAT_ID: {
      const bonus = getEpicBoonFortitudeHealBonus(character) ?? 0;
      return [{ text: `Dádiva da Fortitude: ao curar, ${formatSignedModifier(bonus)} PV; recarrega no início do seu turno`, source: "feat" }];
    }

    case DADIVA_DA_PROEZA_EM_COMBATE_FEAT_ID:
      return [{ text: "Dádiva da Proeza em Combate: errou Atq, pode acertar; recarrega no início do seu turno", source: "feat" }];

    case DADIVA_DA_PROFICIENCIA_EM_PERICIA_FEAT_ID:
      return [{ text: "Dádiva da Proficiência em Perícia", source: "feat" }];

    case DADIVA_DA_RECORDACAO_DE_MAGIA_FEAT_ID:
      return [{ text: "Dádiva da Recordação de Magia: espaço de 1º-4º, joga 1d4; igual ao círculo usado: não gasta", source: "feat" }];

    case DADIVA_DA_RECUPERACAO_FEAT_ID: {
      const halfMaxHp = getEpicBoonRecoveryHalfMaxHp(character) ?? 0;
      return [
        {
          text: `Dádiva da Recuperação: a 0 PV, fica com 1 e cura ${halfMaxHp} [__]/DL\nAB: gasta d10 e cura soma ${checkboxes(10)}/DL`,
          source: "feat",
        },
      ];
    }

    case DADIVA_DA_RESISTENCIA_A_ENERGIA_FEAT_ID: {
      const cd = getEpicBoonEnergyRedirectCd(character) ?? 0;
      const damage = getEpicBoonEnergyRedirectDamage(character) ?? "2d12";
      return [
        {
          text: `Dádiva da Resistência à Energia: Res a 2 tipos, troca em DL\nSofreu dano escolhido: Reação, alvo a 18m faz Salv DEX CD ${cd}; falha: ${damage} do mesmo tipo`,
          source: "feat",
        },
      ];
    }

    case DADIVA_DA_VELOCIDADE_FEAT_ID:
      return [{ text: "Dádiva da Velocidade: AB Desengajar e encerra Imobilizado", source: "feat" }];

    case DADIVA_DA_VIAGEM_DIMENSIONAL_FEAT_ID:
      return [{ text: "Dádiva da Viagem Dimensional: após ação Atacar/Usar Magia, teleporta 9m", source: "feat" }];

    case DADIVA_DA_VISAO_VERDADEIRA_FEAT_ID:
      return [{ text: "Dádiva da Visão Verdadeira: Visão Verdadeira 18m", source: "feat" }];

    case DADIVA_DO_ATAQUE_IRRESISTIVEL_FEAT_ID: {
      const value = getEpicBoonIrresistibleAttackValue(character);
      if (value === null) return [];
      return [{ text: `Dádiva do Ataque Irresistível: Conc/Cort/Perf ignoram Res; 20 no d20 de Atq: +${value} dano do mesmo tipo`, source: "feat" }];
    }

    case DADIVA_DO_DESTINO_FEAT_ID:
      return [{ text: `Dádiva do Destino: Teste de D20 seu/outro a 18m, +2d4 ou -2d4 ${checkboxes(1)}; recupera em Inic/DC/DL`, source: "feat" }];

    case DADIVA_DO_ESPIRITO_DA_NOITE_FEAT_ID:
      return [
        {
          text: "Dádiva do Espírito da Noite: Meia-luz/Escuridão, AB Invisível até executar ação/AB/Reação; Res a danos exceto Psíquico/Radiante",
          source: "feat",
        },
      ];

    default:
      return [];
  }
}
