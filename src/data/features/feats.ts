import type { FeatureDefinition } from "../../domain/features.js";

/**
 * Catálogo de talentos gerais (escolhidos pelo jogador em ASI, níveis
 * 4/8/12...) — INTENCIONALMENTE vazio nesta etapa. Decisão aprovada:
 * implementar o SISTEMA estrutural de talentos agora, mas não o
 * catálogo completo (fica para uma etapa futura, quando o texto de
 * cada talento puder ser confirmado). Enquanto este catálogo estiver
 * vazio, a Ficha Web/Builder devem oferecer entrada de texto manual
 * claramente marcada como fallback — nunca inventar um talento aqui.
 */
export const generalFeats: FeatureDefinition[] = [];
