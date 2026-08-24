import { prisma } from "@/lib/prisma";
import { Carte, TitrePage } from "@/components/ui";
import { FormulaireEntreprise } from "./FormulaireEntreprise";

export const dynamic = "force-dynamic";

export default async function PageParametres() {
  const entreprise =
    (await prisma.entreprise.findFirst()) ??
    (await prisma.entreprise.create({
      data: {
        raisonSociale: "Mon entreprise",
        siret: "",
        adresse: "",
        codePostal: "",
        ville: "",
        email: "",
      },
    }));

  return (
    <>
      <TitrePage
        titre="Réglages"
        sousTitre="Ces informations apparaissent en en-tête et en pied de tous vos documents."
      />

      <Carte className="max-w-3xl">
        <FormulaireEntreprise valeurs={entreprise} />
      </Carte>
    </>
  );
}
