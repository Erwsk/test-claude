import Link from "next/link";
import { formaterEuros } from "@/lib/calculs";
import { formaterDate, totauxDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { Carte, EtatVide, LienBouton, Statut, TitrePage } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function PageDevis() {
  const devis = await prisma.devis.findMany({
    include: { client: true, lignes: true },
    orderBy: { dateEmission: "desc" },
  });

  return (
    <>
      <TitrePage
        titre="Devis"
        sousTitre="Numérotation automatique et continue, comme l'exige l'administration."
        action={<LienBouton href="/devis/nouveau">Nouveau devis</LienBouton>}
      />

      {devis.length === 0 ? (
        <EtatVide
          titre="Aucun devis"
          description="Créez un devis en quelques minutes : choisissez le client, ajoutez vos lignes, le total et la TVA se calculent tout seuls."
          action={<LienBouton href="/devis/nouveau">Créer un devis</LienBouton>}
        />
      ) : (
        <Carte className="divide-y divide-ardoise-200 p-0">
          {devis.map((d) => (
            <Link
              key={d.id}
              href={`/devis/${d.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ardoise-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.objet}</p>
                <p className="text-xs text-ardoise-600">
                  {d.numero} · {d.client.nom} · {formaterDate(d.dateEmission)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-sm font-medium tabular-nums">
                  {formaterEuros(totauxDocument(d).totalTtcCents)}
                </span>
                <Statut valeur={d.statut} />
              </div>
            </Link>
          ))}
        </Carte>
      )}
    </>
  );
}
