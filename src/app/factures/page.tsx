import Link from "next/link";
import { formaterEuros, resteAPayerCents, statutReglement } from "@/lib/calculs";
import { formaterDate, totauxDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { Carte, EtatVide, LienBouton, Statut, TitrePage } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PageFactures() {
  const factures = await prisma.facture.findMany({
    include: { client: true, lignes: true, paiements: true },
    orderBy: { dateEmission: "desc" },
  });

  return (
    <>
      <TitrePage
        titre="Factures"
        sousTitre="Le statut de règlement se déduit des paiements encaissés, jamais saisi à la main."
      />

      {factures.length === 0 ? (
        <EtatVide
          titre="Aucune facture"
          description="Les factures se créent depuis un devis accepté : acompte, puis solde. Le détail et la TVA sont repris automatiquement."
          action={<LienBouton href="/devis">Voir les devis</LienBouton>}
        />
      ) : (
        <Carte className="divide-y divide-ardoise-200 p-0">
          {factures.map((facture) => {
            const totaux = totauxDocument(facture);
            const reste = resteAPayerCents(totaux.totalTtcCents, facture.paiements);
            const statut =
              facture.statut === "BROUILLON"
                ? "BROUILLON"
                : statutReglement(totaux.totalTtcCents, facture.paiements, facture.dateEcheance);

            return (
              <Link
                key={facture.id}
                href={`/factures/${facture.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ardoise-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{facture.objet}</p>
                  <p className="text-xs text-ardoise-600">
                    {facture.numero} · {facture.client.nom} · échéance{" "}
                    {formaterDate(facture.dateEcheance)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-right">
                  <div>
                    <p className="text-sm font-medium tabular-nums">
                      {formaterEuros(totaux.totalTtcCents)}
                    </p>
                    {reste > 0 && reste !== totaux.totalTtcCents && (
                      <p className="text-xs text-ardoise-400 tabular-nums">
                        reste {formaterEuros(reste)}
                      </p>
                    )}
                  </div>
                  <Statut valeur={statut} />
                </div>
              </Link>
            );
          })}
        </Carte>
      )}
    </>
  );
}
