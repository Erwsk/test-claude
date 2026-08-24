/**
 * Cœur métier : calcul des totaux d'un devis ou d'une facture.
 *
 * Règle d'or : tous les montants circulent en CENTIMES entiers. Aucun euro
 * flottant ne traverse ce module, sinon les récapitulatifs de TVA finissent
 * par afficher 1 centime d'écart avec le total TTC.
 */

/** Taux de TVA applicables dans le bâtiment (France). */
export const TAUX_TVA = {
  NORMAL: 20,
  RENOVATION: 10,
  RENOVATION_ENERGETIQUE: 5.5,
  EXONERE: 0,
} as const;

export type LigneCalculable = {
  quantite: number;
  prixUnitaireCents: number;
  tauxTva: number;
  /** Remise sur la ligne, en points de pourcentage (5 = 5 %). */
  remisePct?: number;
  /** Une ligne de titre structure le document mais ne compte pas dans les totaux. */
  categorie?: string;
};

export type BaseTva = {
  taux: number;
  baseCents: number;
  montantCents: number;
};

export type Totaux = {
  /** Somme des lignes, avant remise globale. */
  sousTotalHtCents: number;
  remiseGlobaleCents: number;
  totalHtCents: number;
  /** Ventilation par taux, triée du taux le plus élevé au plus bas. */
  basesTva: BaseTva[];
  totalTvaCents: number;
  totalTtcCents: number;
};

export type OptionsTotaux = {
  /** Remise globale en points de pourcentage, appliquée après les remises de ligne. */
  remiseGlobalePct?: number;
  /** Autoliquidation (sous-traitance BTP, art. 283-2 nonies du CGI) : TVA non collectée. */
  autoliquidation?: boolean;
};

/**
 * Arrondi commercial au centime : 0,5 s'éloigne toujours de zéro.
 * `Math.round` arrondit -0,5 vers 0, ce qui fausse les avoirs.
 */
export function arrondirCentimes(valeur: number): number {
  return valeur < 0 ? -Math.round(-valeur) : Math.round(valeur);
}

/** Total HT d'une ligne, remise de ligne incluse. */
export function totalLigneHtCents(ligne: LigneCalculable): number {
  if (ligne.categorie === "TITRE") return 0;
  const remise = ligne.remisePct ?? 0;
  return arrondirCentimes(ligne.quantite * ligne.prixUnitaireCents * (1 - remise / 100));
}

/**
 * Calcule l'intégralité des totaux d'un document.
 *
 * La remise globale est répartie proportionnellement sur chaque base de TVA,
 * puis le reliquat d'arrondi est absorbé par la base la plus élevée : la somme
 * des bases est ainsi toujours strictement égale au total HT affiché.
 */
export function calculerTotaux(lignes: LigneCalculable[], options: OptionsTotaux = {}): Totaux {
  const remiseGlobalePct = options.remiseGlobalePct ?? 0;
  const autoliquidation = options.autoliquidation ?? false;

  const parTaux = new Map<number, number>();
  let sousTotalHtCents = 0;

  for (const ligne of lignes) {
    const totalLigne = totalLigneHtCents(ligne);
    if (totalLigne === 0 && ligne.categorie === "TITRE") continue;
    sousTotalHtCents += totalLigne;
    const taux = autoliquidation ? 0 : ligne.tauxTva;
    parTaux.set(taux, (parTaux.get(taux) ?? 0) + totalLigne);
  }

  const totalHtCents = arrondirCentimes(sousTotalHtCents * (1 - remiseGlobalePct / 100));
  const remiseGlobaleCents = sousTotalHtCents - totalHtCents;

  const basesTva: BaseTva[] = [...parTaux.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([taux, base]) => ({
      taux,
      baseCents: arrondirCentimes(base * (1 - remiseGlobalePct / 100)),
      montantCents: 0,
    }));

  // Absorbe l'écart d'arrondi sur la base la plus importante en valeur absolue.
  if (basesTva.length > 0) {
    const sommeBases = basesTva.reduce((acc, b) => acc + b.baseCents, 0);
    const ecart = totalHtCents - sommeBases;
    if (ecart !== 0) {
      let indexMax = 0;
      for (let i = 1; i < basesTva.length; i++) {
        if (Math.abs(basesTva[i].baseCents) > Math.abs(basesTva[indexMax].baseCents)) indexMax = i;
      }
      basesTva[indexMax].baseCents += ecart;
    }
  }

  for (const base of basesTva) {
    base.montantCents = arrondirCentimes((base.baseCents * base.taux) / 100);
  }

  const totalTvaCents = basesTva.reduce((acc, b) => acc + b.montantCents, 0);

  return {
    sousTotalHtCents,
    remiseGlobaleCents,
    totalHtCents,
    basesTva,
    totalTvaCents,
    totalTtcCents: totalHtCents + totalTvaCents,
  };
}

/** Montant de l'acompte demandé à la signature du devis. */
export function calculerAcompteCents(totalTtcCents: number, acomptePct: number): number {
  return arrondirCentimes((totalTtcCents * acomptePct) / 100);
}

/** Reste dû sur une facture, après imputation des paiements encaissés. */
export function resteAPayerCents(
  totalTtcCents: number,
  paiements: { montantCents: number }[],
): number {
  const encaisse = paiements.reduce((acc, p) => acc + p.montantCents, 0);
  return totalTtcCents - encaisse;
}

/** Statut de règlement déduit du montant encaissé (jamais saisi à la main). */
export function statutReglement(
  totalTtcCents: number,
  paiements: { montantCents: number }[],
  dateEcheance: Date,
  maintenant: Date = new Date(),
): "PAYEE" | "PAYEE_PARTIEL" | "IMPAYEE" | "ENVOYEE" {
  const reste = resteAPayerCents(totalTtcCents, paiements);
  if (reste <= 0) return "PAYEE";
  const enRetard = maintenant > dateEcheance;
  if (paiements.length > 0) return enRetard ? "IMPAYEE" : "PAYEE_PARTIEL";
  return enRetard ? "IMPAYEE" : "ENVOYEE";
}

/** Date limite de règlement, plafonnée à 60 jours (art. L441-10 du Code de commerce). */
export function calculerEcheance(dateEmission: Date, delaiJours: number): Date {
  const jours = Math.min(Math.max(delaiJours, 0), 60);
  const echeance = new Date(dateEmission);
  echeance.setDate(echeance.getDate() + jours);
  return echeance;
}

/** Date au-delà de laquelle le devis n'engage plus l'artisan. */
export function calculerExpiration(dateEmission: Date, validiteJours: number): Date {
  const expiration = new Date(dateEmission);
  expiration.setDate(expiration.getDate() + validiteJours);
  return expiration;
}

/** Numéro de document séquentiel : `DEV-2026-0001`. */
export function formaterNumero(prefixe: string, annee: number, sequence: number): string {
  return `${prefixe}-${annee}-${String(sequence).padStart(4, "0")}`;
}

const FORMAT_EUROS = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/** Formate des centimes en euros français : `1234567` → `12 345,67 €`. */
export function formaterEuros(cents: number): string {
  return FORMAT_EUROS.format(cents / 100);
}

/** Convertit une saisie utilisateur (`"1 234,56"`, `"1234.56"`) en centimes. */
export function parseEurosEnCentimes(saisie: string): number {
  const normalise = saisie.replace(/\s| |€/g, "").replace(",", ".");
  const valeur = Number.parseFloat(normalise);
  if (Number.isNaN(valeur)) return 0;
  return arrondirCentimes(valeur * 100);
}
