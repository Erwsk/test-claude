"use client";

import { useActionState } from "react";
import { enregistrerPaiement, type ResultatAction } from "@/app/actions";
import { Bouton } from "@/components/ui";

const CHAMP =
  "w-full rounded-lg border border-ardoise-200 px-3 py-2 text-sm focus:border-chantier-500 focus:outline-none";

export function FormulairePaiement({
  factureId,
  resteCents,
}: {
  factureId: string;
  resteCents: number;
}) {
  const [etat, action, enCours] = useActionState<ResultatAction, FormData>(enregistrerPaiement, {});

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="factureId" value={factureId} />

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ardoise-600">Montant encaissé (€)</span>
        <input
          name="montantEuros"
          inputMode="decimal"
          required
          defaultValue={(resteCents / 100).toFixed(2)}
          className={CHAMP}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ardoise-600">Mode de règlement</span>
        <select name="mode" className={CHAMP} defaultValue="VIREMENT">
          <option value="VIREMENT">Virement</option>
          <option value="CHEQUE">Chèque</option>
          <option value="CB">Carte bancaire</option>
          <option value="ESPECES">Espèces</option>
          <option value="AUTRE">Autre</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ardoise-600">Référence</span>
        <input name="reference" className={CHAMP} placeholder="N° de chèque, libellé…" />
      </label>

      {etat.erreur && (
        <p className="text-sm text-rose-600" role="alert">
          {etat.erreur}
        </p>
      )}

      <Bouton type="submit" className="w-full" disabled={enCours}>
        {enCours ? "Enregistrement…" : "Enregistrer le paiement"}
      </Bouton>
    </form>
  );
}
