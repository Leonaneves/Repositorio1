import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ABILITY_PRIORITY_ORDER, highestAbility } from "./AnalyticsRepository.js";

describe("highestAbility", () => {
  it("identifica o maior atributo", () => {
    expect(highestAbility({ FOR: 10, DEX: 18, CON: 10, INT: 10, SAB: 10, CAR: 10 })).toBe("DEX");
  });

  it("em empate, usa a ordem FOR > DEX > CON > INT > SAB > CAR", () => {
    expect(highestAbility({ FOR: 15, DEX: 15, CON: 10, INT: 10, SAB: 10, CAR: 10 })).toBe("FOR");
    expect(highestAbility({ FOR: 10, DEX: 10, CON: 10, INT: 15, SAB: 15, CAR: 10 })).toBe("INT");
  });
});

/**
 * Guarda de consistência: como não há banco real nesta sessão para
 * rodar a função SQL, este teste confirma que
 * `character_build_highest_ability` (na migration) testa os atributos
 * exatamente na mesma ordem de desempate que `highestAbility` usa em
 * TypeScript — para que o cálculo em memória e o cálculo em banco
 * continuem semanticamente equivalentes.
 */
describe("consistência entre highestAbility (TS) e character_build_highest_ability (SQL)", () => {
  it("a migration testa os atributos na mesma ordem de prioridade", () => {
    const migrationPath = resolve(process.cwd(), "supabase/migrations/0001_character_builds.sql");
    const sql = readFileSync(migrationPath, "utf-8");

    const functionStart = sql.indexOf("function character_build_highest_ability");
    expect(functionStart).toBeGreaterThan(-1);
    const functionBody = sql.slice(functionStart, functionStart + 1500);

    // A última opção da cadeia usa `else '<sigla>'` em vez de `then '<sigla>'`.
    const positions = ABILITY_PRIORITY_ORDER.map((ability) => {
      const thenPos = functionBody.indexOf(`then '${ability}'`);
      return thenPos !== -1 ? thenPos : functionBody.indexOf(`else '${ability}'`);
    });
    expect(positions.every((pos) => pos !== -1)).toBe(true);

    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sorted);
  });
});
