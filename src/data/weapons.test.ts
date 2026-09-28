import { describe, expect, it } from "vitest";
import { WEAPON_MASTERIES, weapons, weaponsById } from "./weapons.js";

describe("weapons — catálogo transcrito da tabela aprovada", () => {
  it("tem as 38 armas da tabela (10 simples corpo a corpo + 4 simples à distância + 18 marciais corpo a corpo + 6 marciais à distância)", () => {
    expect(weapons).toHaveLength(38);
  });

  it("todo id é único e casa com a entrada em weaponsById", () => {
    const ids = weapons.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const weapon of weapons) {
      expect(weaponsById[weapon.id]).toBe(weapon);
    }
  });

  it("toda arma tem uma maestria válida (uma das 8 propriedades de Maestria)", () => {
    for (const weapon of weapons) {
      expect(WEAPON_MASTERIES).toContain(weapon.mastery);
    }
  });

  it("Adaga: 1d4 Perfurante, Acuidade + Arremesso 6/18 + Leve, Maestria Ágil", () => {
    const adaga = weaponsById.adaga;
    expect(adaga.damageDice).toBe("1d4");
    expect(adaga.damageType).toBe("Perfurante");
    expect(adaga.properties.acuidade).toBe(true);
    expect(adaga.properties.leve).toBe(true);
    expect(adaga.properties.arremesso).toEqual({ curto: 6, longo: 18 });
    expect(adaga.mastery).toBe("Ágil");
  });

  it("Lança: Arremesso 6/18 + Versátil 1d8, Maestria Drenar", () => {
    const lanca = weaponsById.lanca;
    expect(lanca.damageDice).toBe("1d6");
    expect(lanca.properties.versatil).toBe("1d8");
    expect(lanca.properties.arremesso).toEqual({ curto: 6, longo: 18 });
    expect(lanca.mastery).toBe("Drenar");
  });

  it("Espada Grande: 2d6 Cortante, Duas Mãos + Pesada, Maestria Garantido", () => {
    const espadaGrande = weaponsById.espadaGrande;
    expect(espadaGrande.damageDice).toBe("2d6");
    expect(espadaGrande.properties).toEqual({ duasMaos: true, pesada: true });
    expect(espadaGrande.mastery).toBe("Garantido");
  });

  it("Lança de Montaria: Duas Mãos com a exceção de montado, registrada em notes", () => {
    const lancaDeMontaria = weaponsById.lancaDeMontaria;
    expect(lancaDeMontaria.properties.duasMaos).toBe(true);
    expect(lancaDeMontaria.properties.notes).toMatch(/montado/);
  });

  it("Arco Longo: Munição 45/180 (Flecha), Duas Mãos + Pesada, Maestria Lentidão", () => {
    const arcoLongo = weaponsById.arcoLongo;
    expect(arcoLongo.rangeKind).toBe("distancia");
    expect(arcoLongo.properties.municao).toEqual({ curto: 45, longo: 180, tipo: "Flecha" });
    expect(arcoLongo.mastery).toBe("Lentidão");
  });

  it("Zarabatana: dano fixo (1) Perfurante, Munição 7,5/30 (Agulha) + Recarga, Maestria Afligir", () => {
    const zarabatana = weaponsById.zarabatana;
    expect(zarabatana.damageDice).toBe("1");
    expect(zarabatana.properties.municao).toEqual({ curto: 7.5, longo: 30, tipo: "Agulha" });
    expect(zarabatana.properties.recarga).toBe(true);
    expect(zarabatana.mastery).toBe("Afligir");
  });

  it("toda arma marcial à distância com Munição tem Recarga OU é arco (sem recarga)", () => {
    const arcoLongo = weaponsById.arcoLongo;
    expect(arcoLongo.properties.recarga).toBeUndefined();
    for (const id of ["bestaDeMao", "bestaPesada", "mosquete", "pistola", "zarabatana"]) {
      expect(weaponsById[id].properties.recarga).toBe(true);
    }
  });
});
