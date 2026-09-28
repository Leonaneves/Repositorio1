import type { FeatureDefinition } from "../../domain/features.js";

/**
 * PENDENTE: nenhuma feature de subclasse (D&D 2024 completo, por
 * nível) foi confirmada com você ainda — o volume é grande (30+
 * subclasses × várias features cada) e o projeto proíbe inventar regra
 * sem confirmação (ver §12 da arquitetura aprovada). Fica vazio, de
 * propósito, até você fornecer a tabela real; `getSubclassFeatures`
 * (rules/features.ts) já filtra por `subclassFullName` + nível e não
 * precisa mudar quando os dados chegarem.
 */
export const subclassFeatures: FeatureDefinition[] = [];
