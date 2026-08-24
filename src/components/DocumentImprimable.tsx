import type { Totaux } from "@/lib/calculs";
import { formaterEuros } from "@/lib/calculs";
import { formaterDate } from "@/lib/documents";

type LigneAffichable = {
  id: string;
  designation: string;
  description?: string | null;
  quantite: number;
  unite: string;
  prixUnitaireCents: number;
  tauxTva: number;
  remisePct: number;
  categorie: string;
};

type Entete = {
  raisonSociale: string;
  siret: string;
  numeroTva?: string | null;
  franchiseTva: boolean;
  adresse: string;
  codePostal: string;
  ville: string;
  telephone?: string | null;
  email: string;
  assuranceNom?: string | null;
  assuranceNumero?: string | null;
  penalitesRetard: string;
  indemniteRecouvrement: number;
};

type Destinataire = {
  nom: string;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  siret?: string | null;
};

/**
 * Rendu A4 d'un devis ou d'une facture, imprimable directement depuis le
 * navigateur (Ctrl+P → PDF) : pas de dépendance de génération PDF côté serveur.
 */
export function DocumentImprimable({
  type,
  numero,
  objet,
  dateEmission,
  mentionDate,
  entreprise,
  client,
  lignes,
  totaux,
  autoliquidation,
  bandeauInferieur,
}: {
  type: "DEVIS" | "FACTURE";
  numero: string;
  objet: string;
  dateEmission: Date;
  mentionDate: string;
  entreprise: Entete;
  client: Destinataire;
  lignes: LigneAffichable[];
  totaux: Totaux;
  autoliquidation: boolean;
  bandeauInferieur?: React.ReactNode;
}) {
  return (
    <article className="zone-impression rounded-xl border border-ardoise-200 bg-white p-6 text-[13px] md:p-10">
      <header className="flex flex-wrap justify-between gap-6">
        <div>
          <p className="text-lg font-semibold">{entreprise.raisonSociale}</p>
          <p className="mt-1 whitespace-pre-line text-ardoise-600">
            {entreprise.adresse}
            {"\n"}
            {entreprise.codePostal} {entreprise.ville}
          </p>
          <p className="mt-1 text-ardoise-600">
            {[entreprise.telephone, entreprise.email].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-1 text-ardoise-400">
            SIRET {entreprise.siret || "—"}
            {entreprise.numeroTva ? ` · TVA ${entreprise.numeroTva}` : ""}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xl font-semibold tracking-tight">
            {type === "DEVIS" ? "DEVIS" : "FACTURE"} {numero}
          </p>
          <p className="mt-1 text-ardoise-600">Émis le {formaterDate(dateEmission)}</p>
          <p className="text-ardoise-600">{mentionDate}</p>
        </div>
      </header>

      <section className="mt-8 flex flex-wrap justify-between gap-6">
        <div>
          <p className="text-xs font-medium tracking-wide text-ardoise-400 uppercase">Objet</p>
          <p className="mt-1 max-w-md font-medium">{objet}</p>
        </div>
        <div className="rounded-lg bg-ardoise-50 p-3">
          <p className="text-xs font-medium tracking-wide text-ardoise-400 uppercase">Client</p>
          <p className="mt-1 font-medium">{client.nom}</p>
          <p className="text-ardoise-600">
            {[client.adresse, [client.codePostal, client.ville].filter(Boolean).join(" ")]
              .filter(Boolean)
              .join(", ")}
          </p>
          {client.siret && <p className="text-ardoise-400">SIRET {client.siret}</p>}
        </div>
      </section>

      <table className="mt-8 w-full border-collapse">
        <thead>
          <tr className="border-b border-ardoise-200 text-left text-xs tracking-wide text-ardoise-400 uppercase">
            <th className="py-2">Désignation</th>
            <th className="py-2 text-right">Qté</th>
            <th className="py-2 text-right">P.U. HT</th>
            <th className="py-2 text-right">TVA</th>
            <th className="py-2 text-right">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {lignes.map((ligne) => {
            if (ligne.categorie === "TITRE") {
              return (
                <tr key={ligne.id} className="border-b border-ardoise-100">
                  <td colSpan={5} className="pt-4 pb-1 font-semibold">
                    {ligne.designation}
                  </td>
                </tr>
              );
            }

            const totalLigne = Math.round(
              ligne.quantite * ligne.prixUnitaireCents * (1 - ligne.remisePct / 100),
            );

            return (
              <tr key={ligne.id} className="border-b border-ardoise-100 align-top">
                <td className="py-2">
                  <p>{ligne.designation}</p>
                  {ligne.description && (
                    <p className="text-xs text-ardoise-600">{ligne.description}</p>
                  )}
                  {ligne.remisePct > 0 && (
                    <p className="text-xs text-chantier-600">Remise {ligne.remisePct} %</p>
                  )}
                </td>
                <td className="py-2 text-right tabular-nums whitespace-nowrap">
                  {ligne.quantite.toLocaleString("fr-FR")} {ligne.unite}
                </td>
                <td className="py-2 text-right tabular-nums whitespace-nowrap">
                  {formaterEuros(ligne.prixUnitaireCents)}
                </td>
                <td className="py-2 text-right tabular-nums">
                  {ligne.tauxTva.toString().replace(".", ",")} %
                </td>
                <td className="py-2 text-right font-medium tabular-nums whitespace-nowrap">
                  {formaterEuros(totalLigne)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <section className="mt-6 flex justify-end">
        <dl className="w-full max-w-xs space-y-1">
          {totaux.remiseGlobaleCents !== 0 && (
            <>
              <div className="flex justify-between text-ardoise-600">
                <dt>Sous-total HT</dt>
                <dd className="tabular-nums">{formaterEuros(totaux.sousTotalHtCents)}</dd>
              </div>
              <div className="flex justify-between text-chantier-600">
                <dt>Remise</dt>
                <dd className="tabular-nums">− {formaterEuros(totaux.remiseGlobaleCents)}</dd>
              </div>
            </>
          )}
          <div className="flex justify-between font-medium">
            <dt>Total HT</dt>
            <dd className="tabular-nums">{formaterEuros(totaux.totalHtCents)}</dd>
          </div>
          {totaux.basesTva.map((base) => (
            <div key={base.taux} className="flex justify-between text-ardoise-600">
              <dt>
                TVA {base.taux.toString().replace(".", ",")} % sur {formaterEuros(base.baseCents)}
              </dt>
              <dd className="tabular-nums">{formaterEuros(base.montantCents)}</dd>
            </div>
          ))}
          <div className="flex justify-between border-t border-ardoise-200 pt-2 text-base font-semibold">
            <dt>Total TTC</dt>
            <dd className="tabular-nums">{formaterEuros(totaux.totalTtcCents)}</dd>
          </div>
        </dl>
      </section>

      {bandeauInferieur && <section className="mt-6">{bandeauInferieur}</section>}

      <footer className="mt-10 border-t border-ardoise-200 pt-4 text-[11px] leading-relaxed text-ardoise-400">
        {autoliquidation && (
          <p className="font-medium text-ardoise-600">
            Autoliquidation — TVA due par le preneur (art. 283-2 nonies du CGI).
          </p>
        )}
        {entreprise.franchiseTva && <p>TVA non applicable, art. 293 B du CGI.</p>}
        {entreprise.assuranceNom && (
          <p>
            Assurance décennale : {entreprise.assuranceNom}
            {entreprise.assuranceNumero ? ` — contrat n° ${entreprise.assuranceNumero}` : ""}
          </p>
        )}
        <p>
          Pénalités de retard : {entreprise.penalitesRetard}. Indemnité forfaitaire de recouvrement :{" "}
          {formaterEuros(entreprise.indemniteRecouvrement)}.
        </p>
      </footer>
    </article>
  );
}
