"use client";

import { useActionState } from "react";
import { enregistrerEntreprise, type ResultatAction } from "@/app/actions";
import { Bouton } from "@/components/ui";

const CHAMP =
  "w-full rounded-lg border border-ardoise-200 px-3 py-2 text-sm focus:border-chantier-500 focus:outline-none";

type Valeurs = {
  raisonSociale: string;
  siret: string;
  numeroTva: string | null;
  franchiseTva: boolean;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone: string | null;
  email: string;
  iban: string | null;
  bic: string | null;
  assuranceNom: string | null;
  assuranceNumero: string | null;
  delaiPaiementJours: number;
};

function Champ({
  nom,
  libelle,
  valeur,
  placeholder,
  colonneDouble = false,
}: {
  nom: string;
  libelle: string;
  valeur: string | number | null;
  placeholder?: string;
  colonneDouble?: boolean;
}) {
  return (
    <label className={colonneDouble ? "sm:col-span-2" : undefined}>
      <span className="mb-1 block text-xs font-medium text-ardoise-600">{libelle}</span>
      <input
        name={nom}
        defaultValue={valeur ?? ""}
        placeholder={placeholder}
        className={CHAMP}
      />
    </label>
  );
}

export function FormulaireEntreprise({ valeurs }: { valeurs: Valeurs }) {
  const [etat, action, enCours] = useActionState<ResultatAction, FormData>(
    enregistrerEntreprise,
    {},
  );

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <Champ nom="raisonSociale" libelle="Raison sociale" valeur={valeurs.raisonSociale} colonneDouble />
      <Champ nom="siret" libelle="SIRET" valeur={valeurs.siret} placeholder="123 456 789 00012" />
      <Champ nom="numeroTva" libelle="N° TVA intracommunautaire" valeur={valeurs.numeroTva} placeholder="FR00123456789" />
      <Champ nom="adresse" libelle="Adresse" valeur={valeurs.adresse} colonneDouble />
      <Champ nom="codePostal" libelle="Code postal" valeur={valeurs.codePostal} />
      <Champ nom="ville" libelle="Ville" valeur={valeurs.ville} />
      <Champ nom="telephone" libelle="Téléphone" valeur={valeurs.telephone} />
      <Champ nom="email" libelle="E-mail" valeur={valeurs.email} />
      <Champ nom="iban" libelle="IBAN" valeur={valeurs.iban} />
      <Champ nom="bic" libelle="BIC" valeur={valeurs.bic} />
      <Champ nom="assuranceNom" libelle="Assureur décennale" valeur={valeurs.assuranceNom} />
      <Champ nom="assuranceNumero" libelle="N° de contrat décennale" valeur={valeurs.assuranceNumero} />
      <Champ
        nom="delaiPaiementJours"
        libelle="Délai de paiement (jours, 60 max.)"
        valeur={valeurs.delaiPaiementJours}
      />

      <label className="flex items-center gap-2 text-sm text-ardoise-600 sm:col-span-2">
        <input type="checkbox" name="franchiseTva" defaultChecked={valeurs.franchiseTva} />
        Franchise en base de TVA (art. 293 B du CGI)
      </label>

      {etat.erreur && (
        <p className="text-sm text-rose-600 sm:col-span-2" role="alert">
          {etat.erreur}
        </p>
      )}

      <div className="sm:col-span-2">
        <Bouton type="submit" disabled={enCours}>
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </Bouton>
      </div>
    </form>
  );
}
