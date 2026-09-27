import { ARMOR_IDS, type ArmorId } from "../domain/ids.js";

export type ArmorCategory = "light" | "medium" | "heavy";

/** `full`: soma o modificador de DEX inteiro. `max2`: soma no máximo +2. `none`: não soma DEX. */
export type DexBonusRule = "full" | "max2" | "none";

export interface ArmorDefinition {
  id: ArmorId;
  name: string;
  category: ArmorCategory;
  baseAC: number;
  dexBonus: DexBonusRule;
}

/**
 * As 12 armaduras do PDF original, com CA base e regra de DEX extraídas
 * literalmente do script `AtualizarArmaduras`/`CA`. Não há verificação
 * de Força mínima nem penalidade de Furtividade — fora do escopo desta
 * fase (ver §7.8 da arquitetura), a ser adicionado em versão futura.
 */
export const armors: Record<ArmorId, ArmorDefinition> = {
  acolchoada: { id: "acolchoada", name: "Acolchoada", category: "light", baseAC: 11, dexBonus: "full" },
  couro: { id: "couro", name: "Couro", category: "light", baseAC: 11, dexBonus: "full" },
  couroBatido: { id: "couroBatido", name: "Couro Batido", category: "light", baseAC: 12, dexBonus: "full" },
  gibaoDePeles: { id: "gibaoDePeles", name: "Gibão de Peles", category: "medium", baseAC: 12, dexBonus: "max2" },
  camisaDeMalha: { id: "camisaDeMalha", name: "Camisa de Malha", category: "medium", baseAC: 13, dexBonus: "max2" },
  brunea: { id: "brunea", name: "Brunea", category: "medium", baseAC: 14, dexBonus: "max2" },
  peitoral: { id: "peitoral", name: "Peitoral", category: "medium", baseAC: 14, dexBonus: "max2" },
  meiaArmadura: { id: "meiaArmadura", name: "Meia-Armadura", category: "medium", baseAC: 15, dexBonus: "max2" },
  cotaDeAneis: { id: "cotaDeAneis", name: "Cota de Anéis", category: "heavy", baseAC: 14, dexBonus: "none" },
  cotaDeMalha: { id: "cotaDeMalha", name: "Cota de Malha", category: "heavy", baseAC: 16, dexBonus: "none" },
  cotaDeTalas: { id: "cotaDeTalas", name: "Cota de Talas", category: "heavy", baseAC: 17, dexBonus: "none" },
  placas: { id: "placas", name: "Placas", category: "heavy", baseAC: 18, dexBonus: "none" },
};

export const armorList: ArmorDefinition[] = ARMOR_IDS.map((id) => armors[id]);

/** Bônus de CA concedido por escudo equipado, independente da classe/armadura. */
export const SHIELD_AC_BONUS = 2;
