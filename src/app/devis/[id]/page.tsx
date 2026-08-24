import Link from "next/link";
import { notFound } from "next/navigation";
import { changerStatutDevis, creerFactureDepuisDevis } from "@/app/actions";
import { BoutonImprimer } from "@/components/BoutonImprimer";
import { Bouton, Statut } from "@/components/ui";
import { DocumentImprimable } from "@/components/DocumentImprimable";
import { calculerAcompteCents, calculerExpiration, formaterEuros } from "@/lib/calculs";
import { formaterDate, totauxDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PageDevisDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [devis, entreprise] = await Promise.all([
    prisma.devis.findUnique({
      where: { id },
      include: { client: true, lignes: { orderBy: { ordre: "asc" } }, factures: true },
    }),
    prisma.entreprise.findFirst(),
  ]);

  if (!devis || !entreprise) notFound();

  const totaux = totauxDocument(devis);
  const acompte = calculerAcompteCents(totaux.totalTtcCents, devis.acomptePct);
  const expiration = calculerExpiration(devis.dateEmission, devis.validiteJours);

  return (
    <>
      <div className="sans-impression mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/devis" className="text-sm text-ardoise-600 hover:underline">
            ← Devis
          </Link>
          <Statut valeur={devis.statut} />
        </div>

        <div className="flex flex-wrap gap-2">
          <BoutonImprimer />

          {devis.statut === "BROUILLON" && (
            <form
              action={async () => {
                "use server";
                await changerStatutDevis(devis.id, "ENVOYE");
              }}
            >
              <Bouton type="submit">Marquer comme envoyé</Bouton>
            </form>
          )}

          {devis.statut === "ENVOYE" && (
            <>
              <form
                action={async () => {
                  "use server";
                  await changerStatutDevis(devis.id, "REFUSE");
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-ardoise-200 bg-white px-4 py-2 text-sm font-medium hover:bg-ardoise-50"
                >
                  Refusé
                </button>
              </form>
              <form
                action={async () => {
                  "use server";
                  await changerStatutDevis(devis.id, "ACCEPTE");
                }}
              >
                <Bouton type="submit">Devis accepté</Bouton>
              </form>
            </>
          )}

          {devis.statut === "ACCEPTE" && devis.factures.length === 0 && devis.acomptePct > 0 && (
            <form
              action={async () => {
                "use server";
                await creerFactureDepuisDevis(devis.id, "ACOMPTE");
              }}
            >
              <Bouton type="submit">Facturer l&apos;acompte</Bouton>
            </form>
          )}

          {devis.statut === "ACCEPTE" && (
            <form
              action={async () => {
                "use server";
                await creerFactureDepuisDevis(devis.id, devis.factures.length > 0 ? "SOLDE" : "SIMPLE");
              }}
            >
              <Bouton type="submit">
                {devis.factures.length > 0 ? "Facturer le solde" : "Créer la facture"}
              </Bouton>
            </form>
          )}
        </div>
      </div>

      <DocumentImprimable
        type="DEVIS"
        numero={devis.numero}
        objet={devis.objet}
        dateEmission={devis.dateEmission}
        mentionDate={`Valable jusqu'au ${formaterDate(expiration)}`}
        entreprise={entreprise}
        client={devis.client}
        lignes={devis.lignes}
        totaux={totaux}
        autoliquidation={devis.autoliquidation}
        bandeauInferieur={
          <div className="rounded-lg bg-ardoise-50 p-4 text-[12px]">
            <p>
              <span className="font-medium">Acompte à la signature :</span> {devis.acomptePct} % soit{" "}
              {formaterEuros(acompte)}. Solde à la réception des travaux.
            </p>
            {devis.dureeTravaux && (
              <p className="mt-1">
                <span className="font-medium">Durée estimée :</span> {devis.dureeTravaux}
              </p>
            )}
            {devis.conditions && <p className="mt-1 whitespace-pre-line">{devis.conditions}</p>}
            <p className="mt-3 text-ardoise-600">
              Bon pour accord, date et signature du client précédées de la mention « lu et approuvé » :
            </p>
            <div className="mt-8 h-16 w-56 rounded border border-dashed border-ardoise-200" />
          </div>
        }
      />
    </>
  );
}
