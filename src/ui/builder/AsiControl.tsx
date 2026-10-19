import { useCharacterStore } from "../../state/characterStore.js";
import { formatFeatIneligibilityReason, getChosenAsiFeatIneligibilityReasons, getFeatCatalogForAsiLevel } from "../../rules/feats.js";
import { getAsiFeatOpportunity } from "../../recommendations/currentOpportunityContext.js";
import { useTalentRecommendations, withRecommendedLabel } from "../../services/useTalentRecommendations.js";
import { RecommendationReasonsHint } from "./RecommendationReasonsHint.js";

export interface AsiControlProps {
  level: number;
  /** "Mostrar talentos indisponíveis" (fonte "REESTRUTURAR A ESCOLHA DE TALENTOS PARA OCORRER APÓS OS ATRIBUTOS" §7) — estado da etapa Talentos, nunca próprio deste controle. */
  showUnavailableFeats: boolean;
}

/**
 * Controle de "Aumento no Valor de Atributo" de UM nível — a DECISÃO
 * entre Aumentar Atributos ou Talento (fonte "REESTRUTURAR A ESCOLHA DE
 * TALENTOS PARA OCORRER APÓS OS ATRIBUTOS" §2/§5: esta decisão e a
 * distribuição/escolha em si moram agora na etapa Talentos — por isso
 * este controle NUNCA mostra o `AbilityPointAllocator` diretamente; a
 * etapa Talentos (`Step8FeaturesAndTalents.tsx`) é que renderiza a
 * distribuição logo abaixo deste controle quando o modo é "Aumentar
 * Atributos", identificada por este mesmo nível). Trocar de modo sempre
 * reinicia a distribuição anterior (`characterStore.ts#setAsiMode`) —
 * nunca deixa bônus ocultos.
 *
 * Quando o modo é "Talento" (fonte "IMPLEMENTAR TALENTOS DE ORIGEM NO
 * BUILDER E NO PDF"), este controle também escolhe QUAL talento do
 * catálogo preenche este nível — as escolhas INTERNAS de cada talento
 * (perícias de Habilidoso, lista/truques de Iniciado em Magia etc.)
 * aparecem à parte, na etapa Talentos/"Perícias" (pipeline genérico de
 * `rules/features.ts`, nunca duplicadas aqui). Com `showUnavailableFeats`
 * desligado (padrão), só os talentos ELEGÍVEIS nesta aquisição aparecem
 * no `<select>` (`getFeatCatalogForAsiLevel` já valida em ordem
 * histórica — fonte §6); ligado, os indisponíveis também aparecem,
 * desabilitados, com o motivo específico anexado ao nome (fonte §7).
 * Se o talento JÁ ESCOLHIDO deixou de ser elegível por uma mudança
 * posterior (ex.: um atributo reduzido num nível anterior), um aviso
 * aparece abaixo do seletor — a escolha NUNCA é apagada/substituída
 * sozinha (fonte §9), só sinalizada (e também bloqueia "Avançar" — ver
 * `rules/builderProgress.ts`).
 *
 * Recomendações (fonte "IMPLEMENTAR RECOMENDAÇÕES DE TALENTOS"): até 3
 * talentos ELEGÍVEIS ganham o sufixo "(Recomendado)" — nunca um
 * indisponível, nunca o talento já escolhido que deixou de cumprir os
 * pré-requisitos, nunca uma seleção automática.
 */
export function AsiControl({ level, showUnavailableFeats }: AsiControlProps) {
  const character = useCharacterStore((s) => s.character);
  const setAsiMode = useCharacterStore((s) => s.setAsiMode);
  const setAsiFeat = useCharacterStore((s) => s.setAsiFeat);

  const selection = character.asiSelections[level];
  const catalog = selection?.kind === "feat" ? getFeatCatalogForAsiLevel(character, level) : [];
  const visibleCatalog = showUnavailableFeats ? catalog : catalog.filter((entry) => entry.eligible);
  const ineligibilityReasons = selection?.kind === "feat" ? getChosenAsiFeatIneligibilityReasons(character, level) : [];
  const chosenFeatId = selection?.kind === "feat" ? selection.featId : null;
  const eligibleFeatIds = catalog
    .filter((entry) => entry.eligible && !(entry.feat.id === chosenFeatId && ineligibilityReasons.length > 0))
    .map((entry) => entry.feat.id);
  const recommendedFeats = useTalentRecommendations(selection?.kind === "feat" ? getAsiFeatOpportunity(level) : null, eligibleFeatIds);

  return (
    <article className="feature-card" aria-label={`Aumento no Valor de Atributo — nível ${level}`}>
      <h3>Aumento no Valor de Atributo (nível {level})</h3>
      <fieldset className="feature-choice">
        <legend>Escolha</legend>
        <label className="radio-field">
          <input
            type="radio"
            name={`asi-mode-${level}`}
            checked={selection?.kind === "abilityIncrease"}
            onChange={() => setAsiMode(level, "abilityIncrease")}
          />
          <span>Aumentar Atributos</span>
        </label>
        <label className="radio-field">
          <input type="radio" name={`asi-mode-${level}`} checked={selection?.kind === "feat"} onChange={() => setAsiMode(level, "feat")} />
          <span>Escolher Talento</span>
        </label>
      </fieldset>

      {selection?.kind === "abilityIncrease" && <p className="builder-step__hint">Distribua os pontos abaixo.</p>}

      {selection?.kind === "feat" && (
        <>
          <label className="field feature-choice">
            <span>Talento</span>
            <select value={selection.featId ?? ""} onChange={(e) => setAsiFeat(level, e.target.value || null)}>
              <option value="">- Selecione -</option>
              {visibleCatalog.map((entry) => (
                <option key={entry.feat.id} value={entry.feat.id} disabled={!entry.eligible}>
                  {withRecommendedLabel(entry.feat.name, recommendedFeats.get(entry.feat.id))}
                  {entry.eligible ? "" : ` — ${entry.reasons.map(formatFeatIneligibilityReason).join(" ")}`}
                </option>
              ))}
            </select>
          </label>
          <RecommendationReasonsHint reasons={recommendedFeats} nameOf={(id) => catalog.find((entry) => entry.feat.id === id)?.feat.name ?? id} />
          {ineligibilityReasons.length > 0 && (
            <p className="builder-step__hint builder-step__hint--warning">
              Este talento não atende mais aos pré-requisitos: {ineligibilityReasons.map(formatFeatIneligibilityReason).join(" ")}
            </p>
          )}
        </>
      )}
    </article>
  );
}
