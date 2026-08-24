"use client";

import { useActionState } from "react";
import { creerClient, type ResultatAction } from "@/app/actions";
import { Bouton } from "@/components/ui";

const CHAMP =
  "w-full rounded-lg border border-ardoise-200 px-3 py-2 text-sm focus:border-chantier-500 focus:outline-none";

export function FormulaireClient() {
  const [etat, action, enCours] = useActionState<ResultatAction, FormData>(creerClient, {});

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-ardoise-600">Nom ou raison sociale</span>
        <input name="nom" required className={CHAMP} placeholder="Dupont Martine" />
      </label>

      <label>
        <span className="mb-1 block text-xs font-medium text-ardoise-600">Type</span>
        <select name="type" className={CHAMP} defaultValue="PARTICULIER">
          <option value="PARTICULIER">Particulier</option>
          <option value="PROFESSIONNEL">Professionnel</option>
        </select>
      </label>

      <label>
        <span className="mb-1 block text-xs font-medium text-ardoise-600">Téléphone</span>
        <input name="telephone" className={CHAMP} placeholder="06 12 34 56 78" inputMode="tel" />
      </label>

      <label className="sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-ardoise-600">E-mail</span>
        <input name="email" type="email" className={CHAMP} placeholder="client@exemple.fr" />
      </label>

      <label className="sm:col-span-2">
        <span className="mb-1 block text-xs font-medium text-ardoise-600">Adresse</span>
        <input name="adresse" className={CHAMP} placeholder="12 rue des Lilas" />
      </label>

      <label>
        <span className="mb-1 block text-xs font-medium text-ardoise-600">Code postal</span>
        <input name="codePostal" className={CHAMP} inputMode="numeric" />
      </label>

      <label>
        <span className="mb-1 block text-xs font-medium text-ardoise-600">Ville</span>
        <input name="ville" className={CHAMP} />
      </label>

      {etat.erreur && (
        <p className="sm:col-span-2 text-sm text-rose-600" role="alert">
          {etat.erreur}
        </p>
      )}

      <div className="sm:col-span-2">
        <Bouton type="submit" disabled={enCours}>
          {enCours ? "Enregistrement…" : "Ajouter le client"}
        </Bouton>
      </div>
    </form>
  );
}
