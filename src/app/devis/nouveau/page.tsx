import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EtatVide, LienBouton, TitrePage } from "@/components/ui";
import { FormulaireDevis } from "./FormulaireDevis";

export const dynamic = "force-dynamic";

export default async function PageNouveauDevis() {
  const clients = await prisma.client.findMany({
    where: { archive: false },
    orderBy: { nom: "asc" },
    select: { id: true, nom: true },
  });

  return (
    <>
      <TitrePage
        titre="Nouveau devis"
        sousTitre="Les totaux et la ventilation de TVA se mettent à jour à chaque saisie."
        action={
          <Link href="/devis" className="text-sm text-ardoise-600 hover:underline">
            Retour aux devis
          </Link>
        }
      />

      {clients.length === 0 ? (
        <EtatVide
          titre="Ajoutez d'abord un client"
          description="Un devis doit être adressé à un client identifié. Créez-en un, puis revenez ici."
          action={<LienBouton href="/clients">Ajouter un client</LienBouton>}
        />
      ) : (
        <FormulaireDevis clients={clients} />
      )}
    </>
  );
}
