import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ChoiceInsight } from "../../analytics/types.js";
import { InsightPopover } from "./InsightPopover.js";
import { useInsightSessionStore } from "./insightSessionStore.js";

function makeInsight(id: string, label: string): ChoiceInsight {
  return {
    id,
    kind: "communityInsight",
    metric: "subclassPopularity",
    scopeLabel: "Magos registrados",
    sampleSize: 42,
    items: [{ label, percentage: 50 }],
  };
}

beforeEach(() => {
  useInsightSessionStore.getState().resetSession();
});

describe("InsightPopover — frequência e sessão (§15)", () => {
  it("aparece na primeira vez que um insight fica disponível", () => {
    render(<InsightPopover insight={makeInsight("insight-a", "Evocador")} />);
    expect(screen.getByText(/Evocador/)).toBeInTheDocument();
  });

  it("nunca mostra dois popups automáticos ao mesmo tempo", () => {
    render(
      <>
        <InsightPopover insight={makeInsight("insight-a", "Evocador")} />
        <InsightPopover insight={makeInsight("insight-b", "Abjurador")} />
      </>,
    );
    expect(screen.getByText(/Evocador/)).toBeInTheDocument();
    expect(screen.queryByText(/Abjurador/)).not.toBeInTheDocument();
  });

  it("dispensar um popup libera espaço para o próximo", async () => {
    const { rerender } = render(
      <>
        <InsightPopover insight={makeInsight("insight-a", "Evocador")} />
        <InsightPopover insight={makeInsight("insight-b", "Abjurador")} />
      </>,
    );
    expect(screen.getByText(/Evocador/)).toBeInTheDocument();

    screen.getAllByRole("button", { name: "Dispensar" })[0]?.click();

    rerender(
      <>
        <InsightPopover insight={makeInsight("insight-a", "Evocador")} />
        <InsightPopover insight={makeInsight("insight-b", "Abjurador")} />
      </>,
    );

    expect(screen.queryByText(/Evocador/)).not.toBeInTheDocument();
    expect(screen.getByText(/Abjurador/)).toBeInTheDocument();
  });

  it("não repete a mesma dica na mesma sessão, mesmo remontando o componente", () => {
    const { unmount } = render(<InsightPopover insight={makeInsight("insight-a", "Evocador")} />);
    screen.getAllByRole("button", { name: "Dispensar" })[0]?.click();
    unmount();

    render(<InsightPopover insight={makeInsight("insight-a", "Evocador")} />);
    expect(screen.queryByText(/Evocador/)).not.toBeInTheDocument();
  });
});
