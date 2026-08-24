import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function TitrePage({
  titre,
  sousTitre,
  action,
}: {
  titre: string;
  sousTitre?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{titre}</h1>
        {sousTitre && <p className="mt-1 text-sm text-ardoise-600">{sousTitre}</p>}
      </div>
      {action}
    </div>
  );
}

export function Carte({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-xl border border-ardoise-200 bg-white p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Indicateur({
  libelle,
  valeur,
  detail,
  accent = false,
}: {
  libelle: string;
  valeur: string;
  detail?: string;
  accent?: boolean;
}) {
  return (
    <Carte>
      <p className="text-xs font-medium tracking-wide text-ardoise-600 uppercase">{libelle}</p>
      <p
        className={`mt-2 text-2xl font-semibold tabular-nums ${accent ? "text-chantier-600" : ""}`}
      >
        {valeur}
      </p>
      {detail && <p className="mt-1 text-xs text-ardoise-400">{detail}</p>}
    </Carte>
  );
}

const COULEURS_STATUT: Record<string, string> = {
  BROUILLON: "bg-ardoise-100 text-ardoise-600",
  ENVOYE: "bg-blue-100 text-blue-700",
  ENVOYEE: "bg-blue-100 text-blue-700",
  ACCEPTE: "bg-emerald-100 text-emerald-700",
  REFUSE: "bg-rose-100 text-rose-700",
  EXPIRE: "bg-amber-100 text-amber-700",
  PAYEE: "bg-emerald-100 text-emerald-700",
  PAYEE_PARTIEL: "bg-amber-100 text-amber-700",
  IMPAYEE: "bg-rose-100 text-rose-700",
  ANNULEE: "bg-ardoise-100 text-ardoise-400",
};

const LIBELLES_STATUT: Record<string, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  ENVOYEE: "Envoyée",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
  EXPIRE: "Expiré",
  PAYEE: "Payée",
  PAYEE_PARTIEL: "Payée en partie",
  IMPAYEE: "Impayée",
  ANNULEE: "Annulée",
};

export function Statut({ valeur }: { valeur: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        COULEURS_STATUT[valeur] ?? "bg-ardoise-100 text-ardoise-600"
      }`}
    >
      {LIBELLES_STATUT[valeur] ?? valeur}
    </span>
  );
}

export function Bouton({ className = "", ...props }: ComponentProps<"button">) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg bg-chantier-500 px-4 py-2 text-sm font-medium text-white hover:bg-chantier-600 disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function LienBouton({ className = "", ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      className={`inline-flex items-center justify-center rounded-lg bg-chantier-500 px-4 py-2 text-sm font-medium text-white hover:bg-chantier-600 ${className}`}
      {...props}
    />
  );
}

export function EtatVide({ titre, description, action }: {
  titre: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Carte className="text-center">
      <p className="font-medium">{titre}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ardoise-600">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </Carte>
  );
}
