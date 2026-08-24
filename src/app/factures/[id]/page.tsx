import Link from "next/link";
import { notFound } from "next/navigation";
import { envoyerFacture } from "@/app/actions";
import { BoutonImprimer } from "@/components/BoutonImprimer";
import { DocumentImprimable } from "@/components/DocumentImprimable";
import { Bouton, Carte, Statut } from "@/components/ui";
import { formaterEuros, resteAPayerCents, statutReglement } from "@/lib/calculs";
import { formaterDate, totauxDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { FormulairePaiement } from "./FormulairePaiement";

export const dynamic = "force-dynamic";

const LIBELLES_MODE: Record<string, string> = {
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  CB: "Carte bancaire",
  ESPECES: "Espèces",
  AUTRE: "Autre",
};

export default async function PageFactureDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [facture, entreprise] = await Promise.all([
    prisma.facture.findUnique({
      where: { id },
      include: {
        client: true,
        devis: true,
        lignes: { orderBy: { ordre: "asc" } },
        paiements: { orderBy: { datePaiement: "asc" } },
      },
    }),
    prisma.entreprise.findFirst(),
  ]);

  if (!facture || !entreprise) notFound();

  const totaux = totauxDocument(facture);
  const reste = resteAPayerCents(totaux.totalTtcCents, facture.paiements);
  const statut =
    facture.statut === "BROUILLON"
      ? "BROUILLON"
      : statutReglement(totaux.totalTtcCents, facture.paiements, facture.dateEcheance);

  return (
    <>
      <div className="sans-impression mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/factures" className="text-sm text-ardoise-600 hover:underline">
            ← Factures
          </Link>
          <Statut valeur={statut} />
        </div>

        <div className="flex flex-wrap gap-2">
          <BoutonImprimer />
          {!facture.verrouillee && (
            <form
              action={async () => {
                "use server";
                await envoyerFacture(facture.id);
              }}
            >
              <Bouton type="submit">Marquer comme envoyée</Bouton>
            </form>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
        <DocumentImprimable
          type="FACTURE"
          numero={facture.numero}
          objet={facture.objet}
          dateEmission={facture.dateEmission}
          mentionDate={`À régler avant le ${formaterDate(facture.dateEcheance)}`}
          entreprise={entreprise}
          client={facture.client}
          lignes={facture.lignes}
          totaux={totaux}
          autoliquidation={facture.autoliquidation}
          bandeauInferieur={
            <div className="rounded-lg bg-ardoise-50 p-4 text-[12px]">
              {facture.devis && <p>Référence devis : {facture.devis.numero}</p>}
              {entreprise.iban && (
                <p className="mt-1">
                  Règlement par virement — IBAN {entreprise.iban}
                  {entreprise.bic ? ` · BIC ${entreprise.bic}` : ""}
                </p>
              )}
              {facture.paiements.length > 0 && (
                <p className="mt-1 font-medium">
                  Déjà réglé : {formaterEuros(totaux.totalTtcCents - reste)} — reste dû{" "}
                  {formaterEuros(reste)}
                </p>
              )}
            </div>
          }
        />

        <aside className="sans-impression space-y-3">
          <Carte>
            <h2 className="mb-1 font-medium">Reste à encaisser</h2>
            <p className="text-2xl font-semibold tabular-nums">{formaterEuros(Math.max(reste, 0))}</p>
            <p className="mt-1 text-xs text-ardoise-400">
              sur {formaterEuros(totaux.totalTtcCents)} TTC
            </p>
          </Carte>

          {facture.paiements.length > 0 && (
            <Carte className="p-0">
              <h2 className="border-b border-ardoise-200 px-4 py-3 font-medium">Règlements</h2>
              <ul className="divide-y divide-ardoise-200">
                {facture.paiements.map((paiement) => (
                  <li key={paiement.id} className="flex justify-between gap-2 px-4 py-2 text-sm">
                    <span className="text-ardoise-600">
                      {formaterDate(paiement.datePaiement)} · {LIBELLES_MODE[paiement.mode]}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formaterEuros(paiement.montantCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </Carte>
          )}

          {reste > 0 && (
            <Carte>
              <h2 className="mb-3 font-medium">Encaisser un règlement</h2>
              <FormulairePaiement factureId={facture.id} resteCents={reste} />
            </Carte>
          )}
        </aside>
      </div>
    </>
  );
}
