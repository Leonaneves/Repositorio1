/**
 * Catálogo estruturado de Ferramentas/Instrumentos (fonte "REORGANIZAÇÃO
 * DO BUILDER" §5) — substitui o campo de texto livre que existia para
 * "Ferramentas de Classe". `category` é o que `getEligibleTools`
 * (`rules/tools.ts`) usa para filtrar as opções elegíveis de uma
 * `FeatureChoice` do tipo `toolProficiency` (ex.: Bardo só pode
 * escolher `musicalInstrument`; Artífice só `artisanTool`; Monge
 * qualquer um dos dois). "Ferramentas de Ladrão" fica numa categoria
 * própria (`thievesTools`) — ferramenta real e distinta de "Ferramenta
 * de Artesão", nunca deve aparecer como opção elegível quando a regra
 * só permite Instrumentos Musicais (exemplo explícito da fonte).
 */
export type ToolCategory = "artisanTool" | "musicalInstrument" | "thievesTools";

export interface ToolDefinition {
  id: string;
  name: string;
  category: ToolCategory;
}

export const tools: ToolDefinition[] = [
  // Ferramentas de Artesão (artisanTool)
  { id: "suprimentos-alquimista", name: "Suprimentos de Alquimista", category: "artisanTool" },
  { id: "suprimentos-caligrafo", name: "Suprimentos de Calígrafo", category: "artisanTool" },
  { id: "ferramentas-carpinteiro", name: "Ferramentas de Carpinteiro", category: "artisanTool" },
  { id: "ferramentas-cartografo", name: "Ferramentas de Cartógrafo", category: "artisanTool" },
  { id: "suprimentos-cervejeiro", name: "Suprimentos de Cervejeiro", category: "artisanTool" },
  { id: "ferramentas-coureiro", name: "Ferramentas de Coureiro", category: "artisanTool" },
  { id: "ferramentas-entalhador", name: "Ferramentas de Entalhador", category: "artisanTool" },
  { id: "ferramentas-ferreiro", name: "Ferramentas de Ferreiro", category: "artisanTool" },
  { id: "ferramentas-funileiro", name: "Ferramentas de Funileiro", category: "artisanTool" },
  { id: "ferramentas-joalheiro", name: "Ferramentas de Joalheiro", category: "artisanTool" },
  { id: "ferramentas-oleiro", name: "Ferramentas de Oleiro", category: "artisanTool" },
  { id: "ferramentas-pedreiro", name: "Ferramentas de Pedreiro", category: "artisanTool" },
  { id: "suprimentos-pintor", name: "Suprimentos de Pintor", category: "artisanTool" },
  { id: "ferramentas-sapateiro", name: "Ferramentas de Sapateiro", category: "artisanTool" },
  { id: "ferramentas-tecelao", name: "Ferramentas de Tecelão", category: "artisanTool" },
  { id: "utensilios-cozinheiro", name: "Utensílios de Cozinheiro", category: "artisanTool" },
  { id: "ferramentas-vidreiro", name: "Ferramentas de Vidreiro", category: "artisanTool" },

  // Instrumentos Musicais (musicalInstrument)
  { id: "alaude", name: "Alaúde", category: "musicalInstrument" },
  { id: "flauta", name: "Flauta", category: "musicalInstrument" },
  { id: "flauta-de-pan", name: "Flauta de Pan", category: "musicalInstrument" },
  { id: "gaita-de-foles", name: "Gaita de Foles", category: "musicalInstrument" },
  { id: "lira", name: "Lira", category: "musicalInstrument" },
  { id: "oboe", name: "Oboé", category: "musicalInstrument" },
  { id: "tambor", name: "Tambor", category: "musicalInstrument" },
  { id: "trombeta", name: "Trombeta", category: "musicalInstrument" },
  { id: "violino", name: "Violino", category: "musicalInstrument" },
  { id: "viola", name: "Viola", category: "musicalInstrument" },
  { id: "sanfona", name: "Sanfona", category: "musicalInstrument" },
  { id: "berimbau", name: "Berimbau", category: "musicalInstrument" },
  { id: "pandeiro", name: "Pandeiro", category: "musicalInstrument" },
  { id: "violao", name: "Violão", category: "musicalInstrument" },
  { id: "violoncelo", name: "Violoncelo", category: "musicalInstrument" },

  // Ferramentas de Ladrão (thievesTools) — categoria própria, nunca confundida com Ferramenta de Artesão/Instrumento Musical.
  { id: "ferramentas-ladrao", name: "Ferramentas de Ladrão", category: "thievesTools" },
];

export const toolsById: Record<string, ToolDefinition> = Object.fromEntries(tools.map((tool) => [tool.id, tool]));
