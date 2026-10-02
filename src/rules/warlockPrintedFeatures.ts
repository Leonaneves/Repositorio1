import type { Character } from "../domain/character.js";
import { getAbilityModifier, getEffectiveAbilityScore } from "./abilities.js";
import { getPactMagicSlotCount } from "./classResources.js";
import { PACT_MAGIC_TABLE } from "../data/spellProgression.js";
import { getWarlockSubclassPrintedBlocks } from "./warlockSubclassPrintedFeatures.js";

/**
 * Texto compacto para impressão do Bruxo ("Características de Classe",
 * campos `Carac.Classe.1`/`Carac.Classe.2` do PDF) — fonte "INTEGRAÇÃO
 * COMPLETA — BRUXO, INVOCAÇÕES MÍSTICAS E SUBCLASSES". Representação
 * SEPARADA da regra estruturada completa (`data/features/warlock.ts` +
 * `data/invocations.ts` + `rules/invocations.ts`): nunca usada para
 * cálculo, só montada a partir dela — nunca um texto gigante hardcoded
 * por combinação de nível/subclasse/invocações escolhidas.
 */

/**
 * Resolvedor de texto por invocação — `null` = a invocação já está
 * adequadamente representada em outro lugar da ficha (página de
 * Magias, Talentos, ou efeito automático), nunca ocupando espaço aqui
 * (fonte §8/§66). Recebe `hasInvocation` para resolver dependências
 * entre invocações escolhidas (ex.: suprimir Lâmina Sedenta quando
 * Lâmina Devoradora também estiver presente — mesma mesma
 * característica evoluída, nunca as duas linhas ao mesmo tempo).
 */
type InvocationPrintResolver = (character: Character, subChoice: string, hasInvocation: (id: string) => boolean) => string | null;

const INVOCATION_PRINT_RESOLVERS: Record<string, InvocationPrintResolver> = {
  "explosao-agonizante": (_c, subChoice) => `> Explosão Agonizante: ${subChoice || "Truque"} +CAR no dano`,
  "explosao-repulsiva": (_c, subChoice) => `> Explosão Repulsiva: ${subChoice || "Truque"}, acerto → empurra 3m alvo Grande-`,
  "investimento-mestre-da-corrente": () =>
    "> Investimento Mestre da Corrente: familiar Voo/Natação 12m; AB→Atq; usa sua CD; dano Conc/Cort/Perf pode virar Necr/Rad; Reação→Res ao dano",
  "lamina-sedenta": (_c, _s, hasInvocation) => (hasInvocation("lamina-devoradora") ? null : "> Lâmina Sedenta: arma de pacto 2 Atq"),
  "lamina-devoradora": () => "> Lâmina Devoradora: arma de pacto 3 Atq",
  "lanca-mistica": (character, subChoice) => `> Lança Mística: ${subChoice || "Truque"} alcance +${9 * character.level}m`,
  "mente-mistica": () => "> Mente Mística: Vant Salv CON p/Concent",
  "olhar-de-duas-mentes": () => "> Olhar de Duas Mentes: AB toque aliado; use seus sentidos; AB mantém; a até 18m magias podem partir de você/dele",
  "pacto-da-corrente": () => "> Pacto da Corrente: Familiar sem espaço; ao Atacar, troque 1 Atq por Atq do familiar usando Reação dele",
  "pacto-da-lamina": () => "> Pacto da Lâmina: AB arma corpo a corpo; Prof/Foco; Atq/dano pode usar CAR; dano normal/Necr/Psiq/Rad",
  "presente-das-profundezas": () => "> Presente das Profundezas: respira água; Natação = Desl",
  "presente-dos-protetores": (character) => {
    const carMod = Math.max(1, getAbilityModifier(getEffectiveAbilityScore(character, "CAR")));
    return `> Presente dos Protetores [__]: até ${carMod} nomes; 0 PV → 1 PV; 1/DL`;
  },
  "punicao-mistica": (character) => {
    const circle = PACT_MAGIC_TABLE[character.level]?.slotCircle ?? 1;
    return `> Punição Mística: 1/turno, acerto arma pacto +1 espaço → +${circle + 1}d8 Energ; alvo Enorme- pode Caído`;
  },
  "sorvedouro-de-vida": () => "> Sorvedouro de Vida: 1/turno arma pacto +1d6 Necr/Psiq/Rad; pode gastar 1 Dado Vida e curar dado+CON",
  "visao-da-bruxa": () => "> Visão da Bruxa: Visão Verdadeira 9m",
  "visao-diabolica": () => "> Visão Diabólica: vê normal em Meia-luz/Escuridão mágica ou não até 36m",
};

/** Linhas `>` das invocações escolhidas que precisam de texto impresso — null para as demais (magia/talento/config já representados em outro lugar). */
function getInvocationPrintLines(character: Character): string[] {
  const chosenIds = new Set(character.chosenInvocations.map((c) => c.invocationId));
  const hasInvocation = (id: string) => chosenIds.has(id);

  const lines: string[] = [];
  for (const chosen of character.chosenInvocations) {
    const resolver = INVOCATION_PRINT_RESOLVERS[chosen.invocationId];
    if (!resolver) continue;
    const line = resolver(character, chosen.subChoice, hasInvocation);
    if (line) lines.push(line);
  }
  return lines;
}

interface PrintedBlock {
  acquisitionLevel: number;
  getText: (character: Character) => string | null;
}

const ASTUCIA_MAGICA: PrintedBlock = {
  acquisitionLevel: 2,
  getText: (character) => {
    if (character.classId !== "bruxo" || character.level < 2) return null;
    if (character.level >= 20) {
      return "#Astúcia Mágica [__]\nRito 1 min: recupere todos espaços de Pacto gastos. 1/DL";
    }
    const maxSlots = getPactMagicSlotCount(character) ?? 0;
    const recovered = Math.ceil(maxSlots / 2);
    return `#Astúcia Mágica [__]\nRito 1 min: recupere ${recovered} espaços de Pacto gastos. 1/DL`;
  },
};

const INVOCACOES_MISTICAS: PrintedBlock = {
  acquisitionLevel: 1,
  getText: (character) => {
    if (character.classId !== "bruxo") return null;
    const lines = getInvocationPrintLines(character);
    if (lines.length === 0) return null;
    return ["#Invocações Místicas", ...lines].join("\n");
  },
};

const BASE_CLASS_BLOCKS: PrintedBlock[] = [ASTUCIA_MAGICA, INVOCACOES_MISTICAS];

/**
 * Lista ordenada (por nível de aquisição) dos blocos de texto do Bruxo
 * já adquiridos no nível atual — classe + subclasse entrelaçadas pelo
 * nível (`Array.prototype.sort` é estável).
 */
export function getWarlockPrintedBlocks(character: Character): string[] {
  if (character.classId !== "bruxo") return [];

  const classBlocks = BASE_CLASS_BLOCKS.map((block) => ({ level: block.acquisitionLevel, text: block.getText(character) })).filter(
    (b): b is { level: number; text: string } => b.text !== null,
  );
  const subclassBlocks = getWarlockSubclassPrintedBlocks(character);

  return [...classBlocks, ...subclassBlocks]
    .sort((a, b) => a.level - b.level)
    .map((b) => b.text);
}
