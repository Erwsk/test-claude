"use client";

export function BoutonImprimer({ libelle = "Imprimer / PDF" }: { libelle?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg border border-ardoise-200 bg-white px-4 py-2 text-sm font-medium hover:bg-ardoise-50"
    >
      {libelle}
    </button>
  );
}
