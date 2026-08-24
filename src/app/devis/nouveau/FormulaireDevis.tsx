"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { creerDevis } from "@/app/actions";
import {
  calculerAcompteCents,
  calculerTotaux,
  formaterEuros,
  parseEurosEnCentimes,
  TAUX_TVA,
} from "@/lib/calculs";
import { CATEGORIES_LIGNE, UNITES } from "@/lib/validation";
import { LIBELLES_CATEGORIE } from "@/lib/documents";
import { Bouton, Carte } from "@/components/ui";

type LigneSaisie = {
  cle: string;
  designation: string;
  categorie: (typeof CATEGORIES_LIGNE)[number];
  quantite: string;
  unite: string;
  prixUnitaire: string;
  tauxTva: number;
  remisePct: string;
};

const CHAMP =
  "w-full rounded-lg border border-ardoise-200 px-3 py-2 text-sm focus:border-chantier-500 focus:outline-none";

function ligneVide(): LigneSaisie {
  return {
    cle: crypto.randomUUID(),
    designation: "",
    categorie: "MAIN_OEUVRE",
    quantite: "1",
    unite: "u",
    prixUnitaire: "",
    tauxTva: TAUX_TVA.RENOVATION,
    remisePct: "0",
  };
}

export function FormulaireDevis({ clients }: { clients: { id: string; nom: string }[] }) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [objet, setObjet] = useState("");
  const [validiteJours, setValiditeJours] = useState("30");
  const [remiseGlobalePct, setRemiseGlobalePct] = useState("0");
  const [acomptePct, setAcomptePct] = useState("30");
  const [autoliquidation, setAutoliquidation] = useState(false);
  const [lignes, setLignes] = useState<LigneSaisie[]>([ligneVide()]);

  const lignesCalculables = useMemo(
    () =>
      lignes.map((ligne) => ({
        quantite: Number(ligne.quantite.replace(",", ".")) || 0,
        prixUnitaireCents: parseEurosEnCentimes(ligne.prixUnitaire),
        tauxTva: ligne.tauxTva,
        remisePct: Number(ligne.remisePct.replace(",", ".")) || 0,
        categorie: ligne.categorie,
      })),
    [lignes],
  );

  const totaux = useMemo(
    () =>
      calculerTotaux(lignesCalculables, {
        remiseGlobalePct: Number(remiseGlobalePct.replace(",", ".")) || 0,
        autoliquidation,
      }),
    [lignesCalculables, remiseGlobalePct, autoliquidation],
  );

  const acompte = calculerAcompteCents(
    totaux.totalTtcCents,
    Number(acomptePct.replace(",", ".")) || 0,
  );

  function modifierLigne(cle: string, champ: keyof LigneSaisie, valeur: string | number) {
    setLignes((precedentes) =>
      precedentes.map((ligne) => (ligne.cle === cle ? { ...ligne, [champ]: valeur } : ligne)),
    );
  }

  function envoyer() {
    setErreur(null);
    demarrer(async () => {
      const resultat = await creerDevis({
        clientId,
        objet,
        validiteJours,
        remiseGlobalePct,
        acomptePct,
        autoliquidation,
        lignes: lignes.map((ligne, index) => ({
          designation: ligne.designation,
          categorie: ligne.categorie,
          quantite: lignesCalculables[index].quantite,
          unite: ligne.unite,
          prixUnitaireCents: lignesCalculables[index].prixUnitaireCents,
          tauxTva: ligne.tauxTva,
          remisePct: lignesCalculables[index].remisePct,
        })),
      });

      if ("erreur" in resultat && resultat.erreur) {
        setErreur(resultat.erreur);
        return;
      }
      if ("id" in resultat) router.push(`/devis/${resultat.id}`);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
      <div className="space-y-4">
        <Carte>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-ardoise-600">Objet des travaux</span>
              <input
                className={CHAMP}
                value={objet}
                onChange={(e) => setObjet(e.target.value)}
                placeholder="Rénovation salle de bain — 12 rue des Lilas"
              />
            </label>

            <label>
              <span className="mb-1 block text-xs font-medium text-ardoise-600">Client</span>
              <select
                className={CHAMP}
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-xs font-medium text-ardoise-600">
                Validité (jours)
              </span>
              <input
                className={CHAMP}
                inputMode="numeric"
                value={validiteJours}
                onChange={(e) => setValiditeJours(e.target.value)}
              />
            </label>
          </div>
        </Carte>

        <Carte className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Détail des prestations</h2>
            <button
              type="button"
              onClick={() => setLignes((p) => [...p, ligneVide()])}
              className="rounded-lg border border-ardoise-200 px-3 py-1.5 text-sm hover:bg-ardoise-50"
            >
              + Ligne
            </button>
          </div>

          {lignes.map((ligne, index) => (
            <div key={ligne.cle} className="rounded-lg border border-ardoise-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-ardoise-400">Ligne {index + 1}</span>
                {lignes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLignes((p) => p.filter((l) => l.cle !== ligne.cle))}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Supprimer
                  </button>
                )}
              </div>

              <input
                className={`${CHAMP} mb-2`}
                value={ligne.designation}
                onChange={(e) => modifierLigne(ligne.cle, "designation", e.target.value)}
                placeholder="Dépose de l'ancien carrelage"
              />

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                <select
                  className={`${CHAMP} sm:col-span-2`}
                  value={ligne.categorie}
                  onChange={(e) => modifierLigne(ligne.cle, "categorie", e.target.value)}
                >
                  {CATEGORIES_LIGNE.map((categorie) => (
                    <option key={categorie} value={categorie}>
                      {LIBELLES_CATEGORIE[categorie]}
                    </option>
                  ))}
                </select>

                <input
                  className={CHAMP}
                  inputMode="decimal"
                  aria-label="Quantité"
                  value={ligne.quantite}
                  onChange={(e) => modifierLigne(ligne.cle, "quantite", e.target.value)}
                />

                <select
                  className={CHAMP}
                  aria-label="Unité"
                  value={ligne.unite}
                  onChange={(e) => modifierLigne(ligne.cle, "unite", e.target.value)}
                >
                  {UNITES.map((unite) => (
                    <option key={unite} value={unite}>
                      {unite}
                    </option>
                  ))}
                </select>

                <input
                  className={CHAMP}
                  inputMode="decimal"
                  aria-label="Prix unitaire HT"
                  placeholder="€ HT"
                  value={ligne.prixUnitaire}
                  onChange={(e) => modifierLigne(ligne.cle, "prixUnitaire", e.target.value)}
                />

                <select
                  className={CHAMP}
                  aria-label="Taux de TVA"
                  value={ligne.tauxTva}
                  onChange={(e) => modifierLigne(ligne.cle, "tauxTva", Number(e.target.value))}
                >
                  <option value={TAUX_TVA.NORMAL}>TVA 20 %</option>
                  <option value={TAUX_TVA.RENOVATION}>TVA 10 %</option>
                  <option value={TAUX_TVA.RENOVATION_ENERGETIQUE}>TVA 5,5 %</option>
                  <option value={TAUX_TVA.EXONERE}>TVA 0 %</option>
                </select>
              </div>

              <p className="mt-2 text-right text-sm font-medium tabular-nums">
                {formaterEuros(
                  Math.round(
                    lignesCalculables[index].quantite *
                      lignesCalculables[index].prixUnitaireCents *
                      (1 - lignesCalculables[index].remisePct / 100),
                  ),
                )}{" "}
                HT
              </p>
            </div>
          ))}
        </Carte>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-6">
        <Carte className="space-y-2 text-sm">
          <h2 className="font-medium">Récapitulatif</h2>

          <div className="flex justify-between text-ardoise-600">
            <span>Sous-total HT</span>
            <span className="tabular-nums">{formaterEuros(totaux.sousTotalHtCents)}</span>
          </div>

          <label className="flex items-center justify-between gap-2">
            <span className="text-ardoise-600">Remise globale (%)</span>
            <input
              className="w-20 rounded-lg border border-ardoise-200 px-2 py-1 text-right text-sm"
              inputMode="decimal"
              value={remiseGlobalePct}
              onChange={(e) => setRemiseGlobalePct(e.target.value)}
            />
          </label>

          <div className="flex justify-between border-t border-ardoise-200 pt-2 font-medium">
            <span>Total HT</span>
            <span className="tabular-nums">{formaterEuros(totaux.totalHtCents)}</span>
          </div>

          {totaux.basesTva.map((base) => (
            <div key={base.taux} className="flex justify-between text-ardoise-600">
              <span>TVA {base.taux.toString().replace(".", ",")} %</span>
              <span className="tabular-nums">{formaterEuros(base.montantCents)}</span>
            </div>
          ))}

          <div className="flex justify-between border-t border-ardoise-200 pt-2 text-base font-semibold">
            <span>Total TTC</span>
            <span className="tabular-nums">{formaterEuros(totaux.totalTtcCents)}</span>
          </div>

          <label className="flex items-center justify-between gap-2 pt-1">
            <span className="text-ardoise-600">Acompte (%)</span>
            <input
              className="w-20 rounded-lg border border-ardoise-200 px-2 py-1 text-right text-sm"
              inputMode="decimal"
              value={acomptePct}
              onChange={(e) => setAcomptePct(e.target.value)}
            />
          </label>
          <p className="text-right text-xs text-ardoise-400">
            soit {formaterEuros(acompte)} à la signature
          </p>

          <label className="flex items-center gap-2 border-t border-ardoise-200 pt-2 text-ardoise-600">
            <input
              type="checkbox"
              checked={autoliquidation}
              onChange={(e) => setAutoliquidation(e.target.checked)}
            />
            Autoliquidation de la TVA
          </label>
        </Carte>

        {erreur && (
          <p className="text-sm text-rose-600" role="alert">
            {erreur}
          </p>
        )}

        <Bouton type="button" className="w-full" onClick={envoyer} disabled={enCours}>
          {enCours ? "Création…" : "Créer le devis"}
        </Bouton>
      </aside>
    </div>
  );
}
