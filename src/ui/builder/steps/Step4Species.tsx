import { useCharacterStore } from "../../../state/characterStore.js";
import { useBuilderStore } from "../../../state/builderStore.js";
import { SPECIES_IDS } from "../../../domain/ids.js";
import { species } from "../../../data/species.js";
import { getSpeciesLineageLabel, getSpeciesLineageOptions, hasSpeciesLineage } from "../../../data/speciesLineages.js";
import { getSpeciesTraitsPrintedText } from "../../../rules/speciesLineagePrintedFeatures.js";
import { getAvailableOriginFeatsForHumanSpecies, hasHumanOriginFeatConflictWithBackground } from "../../../rules/feats.js";
import { HUMAN_ORIGIN_FEAT_OPPORTUNITY } from "../../../recommendations/currentOpportunityContext.js";
import { useTalentRecommendations, withRecommendedLabel } from "../../../services/useTalentRecommendations.js";
import { useBuildChoiceRecommendations } from "../../../services/useBuildChoiceRecommendations.js";
import { RecommendationReasonsHint } from "../RecommendationReasonsHint.js";

/**
 * Etapa 4 — escolha de espécie, com subseção de Linhagem/Ancestralidade
 * imediatamente abaixo (fonte "IMPLEMENTAR LINHAGENS E ANCESTRALIDADES
 * NA ETAPA ESPÉCIE" §2): só aparece para Draconato/Elfo/Gnomo/Golias/
 * Tiefling, mostrando só a escolha correspondente à espécie ATUAL —
 * nunca um item próprio na navegação lateral (mesmo padrão de UI
 * própria fora do `FeatureChoice` genérico já usado em Metamagia/
 * Invocações/ASI). O atributo de conjuração das magias de Elfo/Gnomo/
 * Tiefling é sempre resolvido automaticamente por
 * `rules/speciesLineage.ts#getSpeciesLineageSpellcastingAbility` (classe
 * primeiro, senão o maior entre INT/SAB/CAR) — nunca uma escolha manual
 * nesta etapa.
 *
 * Subseção "Talento de Origem" (fonte "ADICIONAR ESCOLHA DE TALENTO DE
 * ORIGEM DO HUMANO NA ETAPA ESPÉCIE" §1): só para Humano, mesma UI
 * própria fora do `FeatureChoice` genérico (igual à de Linhagem acima) —
 * escolhe só QUAL talento (`Character.humanOriginFeatId`), nunca suas
 * escolhas internas, que ficam para "Características e Talentos"/
 * "Perícias" via o pipeline genérico já existente (`rules/feats.ts`
 * expõe a aquisição com `acquisitionKey: "species"`, tratada pelo resto
 * do motor exatamente como a do Antecedente/ASI). Nunca exige atributos
 * distribuídos antes (os 10 Talentos de Origem não têm pré-requisito).
 * Opções recomendadas (fonte "IMPLEMENTAR RECOMENDAÇÕES DE TALENTOS")
 * ganham só o sufixo "(Recomendado)" — nunca uma seleção automática; um
 * talento em conflito com o Antecedente nunca é recomendado.
 */
export function Step4Species() {
  const character = useCharacterStore((s) => s.character);
  const goToStep = useBuilderStore((s) => s.goToStep);
  const speciesId = character.speciesId;
  const setSpecies = useCharacterStore((s) => s.setSpecies);
  const setSpeciesLineage = useCharacterStore((s) => s.setSpeciesLineage);
  const setHumanOriginFeat = useCharacterStore((s) => s.setHumanOriginFeat);

  const lineageOptions = speciesId ? getSpeciesLineageOptions(speciesId) : [];
  const lineageLabel = speciesId ? getSpeciesLineageLabel(speciesId) : null;
  const availableOriginFeats = speciesId === "humano" ? getAvailableOriginFeatsForHumanSpecies(character) : [];
  const hasConflict = hasHumanOriginFeatConflictWithBackground(character);
  const eligibleOriginFeatIds = availableOriginFeats
    .filter((feat) => !(hasConflict && feat.id === character.humanOriginFeatId))
    .map((feat) => feat.id);
  const recommendedSpecies = useBuildChoiceRecommendations({ kind: "species" }, SPECIES_IDS);
  const recommendedOriginFeats = useTalentRecommendations(speciesId === "humano" ? HUMAN_ORIGIN_FEAT_OPPORTUNITY : null, eligibleOriginFeatIds);

  return (
    <div className="builder-step" aria-label="Espécie">
      <label className="field">
        <span>Espécie</span>
        <select value={speciesId ?? ""} onChange={(e) => setSpecies(e.target.value ? (e.target.value as (typeof SPECIES_IDS)[number]) : null)}>
          <option value="">- Selecione -</option>
          {SPECIES_IDS.map((id) => (
            <option key={id} value={id}>
              {withRecommendedLabel(species[id].name, recommendedSpecies.get(id))}
            </option>
          ))}
        </select>
      </label>
      <RecommendationReasonsHint reasons={recommendedSpecies} nameOf={(id) => species[id as (typeof SPECIES_IDS)[number]].name} />

      {speciesId && hasSpeciesLineage(speciesId) && (
        <fieldset className="species-lineage">
          <legend>{lineageLabel}</legend>
          <label className="field">
            <span>{lineageLabel}</span>
            <select value={character.speciesLineageId ?? ""} onChange={(e) => setSpeciesLineage(e.target.value || null)}>
              <option value="">- Selecione -</option>
              {lineageOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </fieldset>
      )}

      {speciesId === "humano" && (
        <fieldset className="species-origin-feat">
          <legend>Talento de Origem</legend>
          <label className="field">
            <span>Talento de Origem (traço Versátil)</span>
            <select value={character.humanOriginFeatId ?? ""} onChange={(e) => setHumanOriginFeat(e.target.value || null)}>
              <option value="">- Selecione -</option>
              {availableOriginFeats.map((feat) => (
                <option key={feat.id} value={feat.id}>
                  {withRecommendedLabel(feat.name, recommendedOriginFeats.get(feat.id))}
                </option>
              ))}
            </select>
          </label>
          <RecommendationReasonsHint reasons={recommendedOriginFeats} nameOf={(id) => availableOriginFeats.find((feat) => feat.id === id)?.name ?? id} />
          {hasConflict && (
            <p className="builder-step__hint builder-step__hint--warning">
              Este talento já é concedido pelo Antecedente atual e não é repetível — escolha outro Talento de Origem para o Humano.
            </p>
          )}
          {character.humanOriginFeatId && (
            <p className="builder-step__hint">
              Escolha(s) internas deste talento (quando houver) —{" "}
              <button type="button" className="review-edit-button" onClick={() => goToStep("featuresAndTalents")}>
                Ver em Características e Talentos
              </button>
            </p>
          )}
        </fieldset>
      )}

      {speciesId && <pre className="builder-step__traits">{getSpeciesTraitsPrintedText(character)}</pre>}
    </div>
  );
}
