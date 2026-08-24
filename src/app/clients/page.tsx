import { prisma } from "@/lib/prisma";
import { Carte, TitrePage } from "@/components/ui";
import { FormulaireClient } from "./FormulaireClient";

export const dynamic = "force-dynamic";

export default async function PageClients() {
  const clients = await prisma.client.findMany({
    where: { archive: false },
    orderBy: { nom: "asc" },
    include: { _count: { select: { devis: true, factures: true } } },
  });

  return (
    <>
      <TitrePage titre="Clients" sousTitre="Votre carnet d'adresses, réutilisable sur chaque devis." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          {clients.length === 0 ? (
            <Carte>
              <p className="text-sm text-ardoise-600">
                Aucun client enregistré. Ajoutez-en un avec le formulaire.
              </p>
            </Carte>
          ) : (
            <Carte className="divide-y divide-ardoise-200 p-0">
              {clients.map((client) => (
                <div key={client.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{client.nom}</p>
                    <span className="text-xs text-ardoise-400">
                      {client.type === "PROFESSIONNEL" ? "Pro" : "Particulier"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ardoise-600">
                    {[client.telephone, client.email, client.ville].filter(Boolean).join(" · ") ||
                      "Aucune coordonnée"}
                  </p>
                  <p className="mt-1 text-xs text-ardoise-400">
                    {client._count.devis} devis · {client._count.factures} facture
                    {client._count.factures > 1 ? "s" : ""}
                  </p>
                </div>
              ))}
            </Carte>
          )}
        </section>

        <aside>
          <Carte>
            <h2 className="mb-3 font-medium">Nouveau client</h2>
            <FormulaireClient />
          </Carte>
        </aside>
      </div>
    </>
  );
}
