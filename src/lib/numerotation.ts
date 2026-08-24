import type { Prisma } from "@prisma/client";
import { formaterNumero } from "./calculs";
import { prisma } from "./prisma";

export type TypeDocument = "DEVIS" | "FACTURE";

/**
 * Réserve le prochain numéro séquentiel pour l'année en cours.
 *
 * L'incrément et la lecture se font dans la même transaction : deux devis créés
 * simultanément ne peuvent pas obtenir le même numéro, ce qui casserait
 * l'obligation de numérotation continue.
 */
export async function reserverNumero(
  type: TypeDocument,
  prefixe: string,
  client: Prisma.TransactionClient = prisma,
  annee: number = new Date().getFullYear(),
): Promise<string> {
  const compteur = await client.compteur.upsert({
    where: { type_annee: { type, annee } },
    create: { type, annee, dernier: 1 },
    update: { dernier: { increment: 1 } },
  });

  return formaterNumero(prefixe, annee, compteur.dernier);
}
