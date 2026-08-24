import { describe, expect, it } from "vitest";
import {
  arrondirCentimes,
  calculerAcompteCents,
  calculerEcheance,
  calculerTotaux,
  formaterEuros,
  formaterNumero,
  parseEurosEnCentimes,
  resteAPayerCents,
  statutReglement,
  totalLigneHtCents,
} from "./calculs";

describe("arrondirCentimes", () => {
  it("arrondit 0,5 en s'éloignant de zéro", () => {
    expect(arrondirCentimes(10.5)).toBe(11);
    expect(arrondirCentimes(-10.5)).toBe(-11);
  });
});

describe("totalLigneHtCents", () => {
  it("multiplie quantité et prix unitaire", () => {
    expect(totalLigneHtCents({ quantite: 12.5, prixUnitaireCents: 4500, tauxTva: 10 })).toBe(56250);
  });

  it("applique la remise de ligne", () => {
    expect(
      totalLigneHtCents({ quantite: 2, prixUnitaireCents: 10000, tauxTva: 20, remisePct: 15 }),
    ).toBe(17000);
  });

  it("ignore les lignes de titre", () => {
    expect(
      totalLigneHtCents({
        quantite: 1,
        prixUnitaireCents: 99900,
        tauxTva: 20,
        categorie: "TITRE",
      }),
    ).toBe(0);
  });
});

describe("calculerTotaux", () => {
  it("ventile la TVA par taux et trie du plus élevé au plus bas", () => {
    const totaux = calculerTotaux([
      { quantite: 1, prixUnitaireCents: 100000, tauxTva: 10, categorie: "MAIN_OEUVRE" },
      { quantite: 1, prixUnitaireCents: 50000, tauxTva: 20, categorie: "FOURNITURE" },
    ]);

    expect(totaux.totalHtCents).toBe(150000);
    expect(totaux.basesTva.map((b) => b.taux)).toEqual([20, 10]);
    expect(totaux.basesTva.find((b) => b.taux === 20)?.montantCents).toBe(10000);
    expect(totaux.basesTva.find((b) => b.taux === 10)?.montantCents).toBe(10000);
    expect(totaux.totalTvaCents).toBe(20000);
    expect(totaux.totalTtcCents).toBe(170000);
  });

  it("regroupe les lignes partageant le même taux", () => {
    const totaux = calculerTotaux([
      { quantite: 3, prixUnitaireCents: 2000, tauxTva: 20 },
      { quantite: 2, prixUnitaireCents: 1500, tauxTva: 20 },
    ]);

    expect(totaux.basesTva).toHaveLength(1);
    expect(totaux.basesTva[0].baseCents).toBe(9000);
  });

  it("répartit la remise globale sur chaque base sans perdre de centime", () => {
    const totaux = calculerTotaux(
      [
        { quantite: 1, prixUnitaireCents: 33333, tauxTva: 20 },
        { quantite: 1, prixUnitaireCents: 33333, tauxTva: 10 },
        { quantite: 1, prixUnitaireCents: 33333, tauxTva: 5.5 },
      ],
      { remiseGlobalePct: 7 },
    );

    const sommeBases = totaux.basesTva.reduce((acc, b) => acc + b.baseCents, 0);
    expect(sommeBases).toBe(totaux.totalHtCents);
    expect(totaux.sousTotalHtCents - totaux.remiseGlobaleCents).toBe(totaux.totalHtCents);
  });

  it("neutralise la TVA en autoliquidation", () => {
    const totaux = calculerTotaux(
      [
        { quantite: 1, prixUnitaireCents: 200000, tauxTva: 20 },
        { quantite: 1, prixUnitaireCents: 100000, tauxTva: 10 },
      ],
      { autoliquidation: true },
    );

    expect(totaux.totalTvaCents).toBe(0);
    expect(totaux.totalTtcCents).toBe(totaux.totalHtCents);
    expect(totaux.basesTva).toEqual([{ taux: 0, baseCents: 300000, montantCents: 0 }]);
  });

  it("renvoie des totaux nuls pour un document vide", () => {
    const totaux = calculerTotaux([]);
    expect(totaux).toMatchObject({ totalHtCents: 0, totalTvaCents: 0, totalTtcCents: 0 });
    expect(totaux.basesTva).toEqual([]);
  });

  it("garde le total TTC cohérent avec la somme HT + TVA", () => {
    const totaux = calculerTotaux(
      [
        { quantite: 7.35, prixUnitaireCents: 1233, tauxTva: 5.5 },
        { quantite: 3, prixUnitaireCents: 899, tauxTva: 20, remisePct: 12.5 },
      ],
      { remiseGlobalePct: 3.5 },
    );

    expect(totaux.totalTtcCents).toBe(totaux.totalHtCents + totaux.totalTvaCents);
  });
});

describe("calculerAcompteCents", () => {
  it("calcule un acompte de 30 %", () => {
    expect(calculerAcompteCents(170000, 30)).toBe(51000);
  });
});

describe("resteAPayerCents", () => {
  it("déduit les paiements encaissés", () => {
    expect(resteAPayerCents(120000, [{ montantCents: 36000 }, { montantCents: 40000 }])).toBe(44000);
  });
});

describe("statutReglement", () => {
  const echeance = new Date("2026-03-31");

  it("passe à PAYEE dès que le reste dû est soldé", () => {
    expect(statutReglement(100000, [{ montantCents: 100000 }], echeance)).toBe("PAYEE");
  });

  it("reste ENVOYEE avant l'échéance sans paiement", () => {
    expect(statutReglement(100000, [], echeance, new Date("2026-03-01"))).toBe("ENVOYEE");
  });

  it("bascule en IMPAYEE après l'échéance", () => {
    expect(statutReglement(100000, [], echeance, new Date("2026-04-15"))).toBe("IMPAYEE");
  });

  it("signale un paiement partiel avant échéance", () => {
    expect(
      statutReglement(100000, [{ montantCents: 30000 }], echeance, new Date("2026-03-01")),
    ).toBe("PAYEE_PARTIEL");
  });
});

describe("calculerEcheance", () => {
  it("ajoute le délai de paiement", () => {
    expect(calculerEcheance(new Date("2026-01-15"), 30).toISOString().slice(0, 10)).toBe(
      "2026-02-14",
    );
  });

  it("plafonne le délai à 60 jours", () => {
    expect(calculerEcheance(new Date("2026-01-01"), 120).toISOString().slice(0, 10)).toBe(
      "2026-03-02",
    );
  });
});

describe("formaterNumero", () => {
  it("produit un numéro séquentiel sur 4 chiffres", () => {
    expect(formaterNumero("DEV", 2026, 7)).toBe("DEV-2026-0007");
    expect(formaterNumero("FA", 2026, 1234)).toBe("FA-2026-1234");
  });
});

describe("formatage des euros", () => {
  it("fait l'aller-retour saisie → centimes → affichage", () => {
    expect(parseEurosEnCentimes("1 234,56 €")).toBe(123456);
    expect(parseEurosEnCentimes("1234.56")).toBe(123456);
    expect(parseEurosEnCentimes("abc")).toBe(0);
    expect(formaterEuros(123456)).toMatch(/1\s?234,56/);
  });
});
