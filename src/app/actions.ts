"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculerEcheance, calculerTotaux, repartirAcompteHt } from "@/lib/calculs";
import { reserverNumero } from "@/lib/numerotation";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { clientSchema, devisSchema, paiementSchema } from "@/lib/validation";

export type ResultatAction = { erreur?: string };

/** Récupère les paramètres de l'entreprise, en les créant au premier lancement. */
async function entreprise() {
  const existante = await prisma.entreprise.findFirst();
  if (existante) return existante;

  return prisma.entreprise.create({
    data: {
      raisonSociale: "Mon entreprise",
      siret: "",
      adresse: "",
      codePostal: "",
      ville: "",
      email: "",
    },
  });
}

export async function creerClient(
  _etat: ResultatAction,
  formData: FormData,
): Promise<ResultatAction> {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { erreur: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const { email, ...reste } = parsed.data;
  await prisma.client.create({ data: { ...reste, email: email || null } });

  revalidatePath("/clients");
  return {};
}

export async function creerDevis(donnees: unknown): Promise<{ id: string } | ResultatAction> {
  const parsed = devisSchema.safeParse(donnees);
  if (!parsed.success) {
    return { erreur: parsed.error.issues[0]?.message ?? "Devis invalide" };
  }

  const { lignes, chantierId, ...entete } = parsed.data;
  const parametres = await entreprise();

  const devis = await prisma.$transaction(async (tx) => {
    const numero = await reserverNumero("DEVIS", parametres.prefixeDevis, tx);
    return tx.devis.create({
      data: {
        ...entete,
        numero,
        chantierId: chantierId || null,
        lignes: {
          create: lignes.map((ligne, index) => ({ ...ligne, ordre: index })),
        },
      },
    });
  });

  revalidatePath("/devis");
  revalidatePath("/");
  return { id: devis.id };
}

export async function changerStatutDevis(devisId: string, statut: string): Promise<void> {
  await prisma.devis.update({
    where: { id: devisId },
    data: {
      statut,
      dateReponse: statut === "ACCEPTE" || statut === "REFUSE" ? new Date() : null,
    },
  });

  revalidatePath("/devis");
  revalidatePath(`/devis/${devisId}`);
  revalidatePath("/");
}

/**
 * Transforme un devis accepté en facture.
 *
 * Une facture d'ACOMPTE ne reprend pas le détail des lignes : elle porte une
 * ligne unique au pourcentage convenu, imputée sur le taux de TVA majoritaire
 * du devis. Le solde reprendra le détail complet, acompte déduit.
 */
export async function creerFactureDepuisDevis(
  devisId: string,
  type: "ACOMPTE" | "SOLDE" | "SIMPLE" = "SIMPLE",
): Promise<void> {
  const devis = await prisma.devis.findUniqueOrThrow({
    where: { id: devisId },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });

  const parametres = await entreprise();
  const dateEmission = new Date();

  const totaux = calculerTotaux(devis.lignes, {
    remiseGlobalePct: devis.remiseGlobalePct,
    autoliquidation: devis.autoliquidation,
  });

  const facture = await prisma.$transaction(async (tx) => {
    const numero = await reserverNumero("FACTURE", parametres.prefixeFacture, tx);

    const lignes =
      type === "ACOMPTE"
        ? repartirAcompteHt(totaux, devis.acomptePct).map((base, index) => ({
            ordre: index,
            designation:
              `Acompte de ${devis.acomptePct} % sur devis ${devis.numero}` +
              (totaux.basesTva.length > 1
                ? ` — prestations à ${base.taux.toString().replace(".", ",")} %`
                : ""),
            categorie: "FORFAIT",
            quantite: 1,
            unite: "forfait",
            prixUnitaireCents: base.baseCents,
            tauxTva: base.taux,
            remisePct: 0,
          }))
        : devis.lignes.map((ligne, index) => ({
            ordre: index,
            designation: ligne.designation,
            description: ligne.description,
            categorie: ligne.categorie,
            quantite: ligne.quantite,
            unite: ligne.unite,
            prixUnitaireCents: ligne.prixUnitaireCents,
            tauxTva: ligne.tauxTva,
            remisePct: ligne.remisePct,
          }));

    return tx.facture.create({
      data: {
        numero,
        type,
        objet: devis.objet,
        dateEmission,
        dateEcheance: calculerEcheance(dateEmission, parametres.delaiPaiementJours),
        remiseGlobalePct: type === "ACOMPTE" ? 0 : devis.remiseGlobalePct,
        autoliquidation: devis.autoliquidation,
        clientId: devis.clientId,
        chantierId: devis.chantierId,
        devisId: devis.id,
        lignes: { create: lignes },
      },
    });
  });

  revalidatePath("/factures");
  revalidatePath("/");
  redirect(`/factures/${facture.id}`);
}

export async function enregistrerPaiement(
  _etat: ResultatAction,
  formData: FormData,
): Promise<ResultatAction> {
  const brut = Object.fromEntries(formData);
  const parsed = paiementSchema.safeParse({
    ...brut,
    montantCents: Math.round(Number(brut.montantEuros ?? 0) * 100),
  });

  if (!parsed.success) {
    return { erreur: parsed.error.issues[0]?.message ?? "Paiement invalide" };
  }

  // Encaisser un règlement vaut émission : on ne peut pas être payé d'une facture
  // restée à l'état de brouillon, et une facture émise n'est plus modifiable.
  await prisma.$transaction([
    prisma.paiement.create({ data: parsed.data }),
    prisma.facture.updateMany({
      where: { id: parsed.data.factureId, verrouillee: false },
      data: { statut: "ENVOYEE", verrouillee: true },
    }),
  ]);

  revalidatePath(`/factures/${parsed.data.factureId}`);
  revalidatePath("/factures");
  revalidatePath("/");
  return {};
}

/** Verrouille la facture : une fois envoyée au client, elle n'est plus modifiable. */
export async function envoyerFacture(factureId: string): Promise<void> {
  await prisma.facture.update({
    where: { id: factureId },
    data: { statut: "ENVOYEE", verrouillee: true },
  });

  revalidatePath("/factures");
  revalidatePath(`/factures/${factureId}`);
}

const entrepriseSchema = z.object({
  raisonSociale: z.string().trim().min(1, "La raison sociale est obligatoire"),
  siret: z.string().trim(),
  numeroTva: z.string().trim(),
  franchiseTva: z.coerce.boolean().default(false),
  adresse: z.string().trim(),
  codePostal: z.string().trim(),
  ville: z.string().trim(),
  telephone: z.string().trim(),
  email: z.string().trim(),
  iban: z.string().trim(),
  bic: z.string().trim(),
  assuranceNom: z.string().trim(),
  assuranceNumero: z.string().trim(),
  delaiPaiementJours: z.coerce.number().int().min(0).max(60),
});

export async function enregistrerEntreprise(
  _etat: ResultatAction,
  formData: FormData,
): Promise<ResultatAction> {
  const brut = Object.fromEntries(formData);
  const parsed = entrepriseSchema.safeParse({
    ...brut,
    franchiseTva: formData.get("franchiseTva") === "on",
  });

  if (!parsed.success) {
    return { erreur: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const actuelle = await entreprise();
  await prisma.entreprise.update({ where: { id: actuelle.id }, data: parsed.data });

  revalidatePath("/parametres");
  return {};
}
