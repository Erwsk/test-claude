import { z } from "zod";

export const CATEGORIES_LIGNE = [
  "MAIN_OEUVRE",
  "FOURNITURE",
  "FORFAIT",
  "DEPLACEMENT",
  "TITRE",
] as const;

export const UNITES = ["u", "h", "j", "m²", "ml", "m³", "kg", "forfait"] as const;

export const ligneSchema = z.object({
  designation: z.string().trim().min(1, "La désignation est obligatoire"),
  description: z.string().trim().optional(),
  categorie: z.enum(CATEGORIES_LIGNE).default("FORFAIT"),
  quantite: z.coerce.number().min(0, "La quantité ne peut pas être négative"),
  unite: z.string().default("u"),
  prixUnitaireCents: z.coerce.number().int(),
  tauxTva: z.coerce.number().min(0).max(100),
  remisePct: z.coerce.number().min(0).max(100).default(0),
});

export const clientSchema = z.object({
  type: z.enum(["PARTICULIER", "PROFESSIONNEL"]).default("PARTICULIER"),
  nom: z.string().trim().min(1, "Le nom est obligatoire"),
  contact: z.string().trim().optional(),
  email: z.string().trim().email("Adresse e-mail invalide").optional().or(z.literal("")),
  telephone: z.string().trim().optional(),
  adresse: z.string().trim().optional(),
  codePostal: z.string().trim().optional(),
  ville: z.string().trim().optional(),
  siret: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export const devisSchema = z.object({
  clientId: z.string().min(1, "Sélectionnez un client"),
  chantierId: z.string().optional(),
  objet: z.string().trim().min(1, "L'objet du devis est obligatoire"),
  validiteJours: z.coerce.number().int().min(1).max(365).default(30),
  dureeTravaux: z.string().trim().optional(),
  remiseGlobalePct: z.coerce.number().min(0).max(100).default(0),
  acomptePct: z.coerce.number().min(0).max(100).default(30),
  autoliquidation: z.coerce.boolean().default(false),
  conditions: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  lignes: z.array(ligneSchema).min(1, "Ajoutez au moins une ligne"),
});

export const paiementSchema = z.object({
  factureId: z.string().min(1),
  montantCents: z.coerce.number().int().positive("Le montant doit être positif"),
  mode: z.enum(["VIREMENT", "CHEQUE", "ESPECES", "CB", "AUTRE"]).default("VIREMENT"),
  datePaiement: z.coerce.date().default(() => new Date()),
  reference: z.string().trim().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
export type DevisInput = z.infer<typeof devisSchema>;
export type LigneInput = z.infer<typeof ligneSchema>;
export type PaiementInput = z.infer<typeof paiementSchema>;
