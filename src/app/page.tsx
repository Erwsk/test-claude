import Link from "next/link";
import { formaterEuros, resteAPayerCents } from "@/lib/calculs";
import { formaterDate, totauxDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { Carte, EtatVide, Indicateur, LienBouton, Statut, TitrePage } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function TableauDeBord() {
  const debutDuMois = new Date();
  debutDuMois.setDate(1);
  debutDuMois.setHours(0, 0, 0, 0);

  const [devis, factures] = await Promise.all([
    prisma.devis.findMany({
      include: { client: true, lignes: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.facture.findMany({
      include: { client: true, lignes: true, paiements: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const devisEnAttente = devis.filter((d) => d.statut === "ENVOYE");
  const montantEnAttente = devisEnAttente.reduce(
    (acc, d) => acc + totauxDocument(d).totalTtcCents,
    0,
  );

  const impayees = factures.filter((f) => {
    const reste = resteAPayerCents(totauxDocument(f).totalTtcCents, f.paiements);
    return reste > 0 && f.statut !== "BROUILLON" && f.statut !== "ANNULEE";
  });
  const montantImpaye = impayees.reduce(
    (acc, f) => acc + resteAPayerCents(totauxDocument(f).totalTtcCents, f.paiements),
    0,
  );

  const encaisseCeMois = factures
    .flatMap((f) => f.paiements)
    .filter((p) => p.datePaiement >= debutDuMois)
    .reduce((acc, p) => acc + p.montantCents, 0);

  const enRetard = impayees.filter((f) => f.dateEcheance < new Date());

  return (
    <>
      <TitrePage
        titre="Tableau de bord"
        sousTitre="L'essentiel de votre activité, en un coup d'œil."
        action={<LienBouton href="/devis/nouveau">Nouveau devis</LienBouton>}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Indicateur
          libelle="Encaissé ce mois"
          valeur={formaterEuros(encaisseCeMois)}
          detail="Paiements reçus depuis le 1er du mois"
        />
        <Indicateur
          libelle="Devis en attente"
          valeur={formaterEuros(montantEnAttente)}
          detail={`${devisEnAttente.length} devis envoyé${devisEnAttente.length > 1 ? "s" : ""}`}
        />
        <Indicateur
          libelle="Reste à encaisser"
          valeur={formaterEuros(montantImpaye)}
          detail={
            enRetard.length > 0
              ? `dont ${enRetard.length} facture${enRetard.length > 1 ? "s" : ""} en retard`
              : "Aucun retard de paiement"
          }
          accent={enRetard.length > 0}
        />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-ardoise-600 uppercase">
          Derniers devis
        </h2>
        {devis.length === 0 ? (
          <EtatVide
            titre="Aucun devis pour le moment"
            description="Créez votre premier devis depuis le chantier : il sera numéroté automatiquement et prêt à envoyer."
            action={<LienBouton href="/devis/nouveau">Créer un devis</LienBouton>}
          />
        ) : (
          <Carte className="divide-y divide-ardoise-200 p-0">
            {devis.slice(0, 5).map((d) => (
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
      </section>
    </>
  );
}
