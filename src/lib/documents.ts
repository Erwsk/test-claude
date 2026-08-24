import { calculerTotaux, type LigneCalculable, type Totaux } from "./calculs";

type DocumentAvecLignes = {
  remiseGlobalePct: number;
  autoliquidation: boolean;
  lignes: LigneCalculable[];
};

/** Totaux d'un devis ou d'une facture chargé depuis la base. */
export function totauxDocument(document: DocumentAvecLignes): Totaux {
  return calculerTotaux(document.lignes, {
    remiseGlobalePct: document.remiseGlobalePct,
    autoliquidation: document.autoliquidation,
  });
}

const FORMAT_DATE = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formaterDate(date: Date): string {
  return FORMAT_DATE.format(date);
}

export const LIBELLES_CATEGORIE: Record<string, string> = {
  MAIN_OEUVRE: "Main d'œuvre",
  FOURNITURE: "Fourniture",
  FORFAIT: "Forfait",
  DEPLACEMENT: "Déplacement",
  TITRE: "Titre",
};
