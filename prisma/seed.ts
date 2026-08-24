/**
 * Jeu de données de démonstration : une entreprise de rénovation, deux clients,
 * un devis accepté et sa facture d'acompte déjà encaissée.
 * Usage : npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.paiement.deleteMany();
  await prisma.ligneFacture.deleteMany();
  await prisma.facture.deleteMany();
  await prisma.ligneDevis.deleteMany();
  await prisma.devis.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.chantier.deleteMany();
  await prisma.client.deleteMany();
  await prisma.compteur.deleteMany();
  await prisma.entreprise.deleteMany();

  await prisma.entreprise.create({
    data: {
      raisonSociale: "Rénov'Atelier",
      formeJuridique: "EURL",
      siret: "84512367800019",
      numeroTva: "FR32845123678",
      adresse: "7 impasse des Charpentiers",
      codePostal: "69003",
      ville: "Lyon",
      telephone: "04 78 00 11 22",
      email: "contact@renov-atelier.fr",
      iban: "FR7630004000031234567890143",
      bic: "BNPAFRPP",
      assuranceNom: "MAAF Pro",
      assuranceNumero: "DEC-2024-88117",
      assuranceCouverture: "France métropolitaine",
      delaiPaiementJours: 30,
    },
  });

  const martine = await prisma.client.create({
    data: {
      nom: "Martine Dupont",
      type: "PARTICULIER",
      email: "m.dupont@exemple.fr",
      telephone: "06 12 34 56 78",
      adresse: "12 rue des Lilas",
      codePostal: "69006",
      ville: "Lyon",
    },
  });

  await prisma.client.create({
    data: {
      nom: "SCI Bellecour Immobilier",
      type: "PROFESSIONNEL",
      contact: "Karim Belhadj",
      email: "gestion@sci-bellecour.fr",
      telephone: "04 72 40 30 20",
      adresse: "3 place Bellecour",
      codePostal: "69002",
      ville: "Lyon",
      siret: "79912345600024",
    },
  });

  const chantier = await prisma.chantier.create({
    data: {
      nom: "Salle de bain — appartement Lilas",
      adresse: "12 rue des Lilas",
      codePostal: "69006",
      ville: "Lyon",
      statut: "EN_COURS",
      clientId: martine.id,
    },
  });

  const annee = new Date().getFullYear();

  const devis = await prisma.devis.create({
    data: {
      numero: `DEV-${annee}-0001`,
      statut: "ACCEPTE",
      objet: "Rénovation complète d'une salle de bain de 6 m²",
      validiteJours: 30,
      dureeTravaux: "3 semaines",
      acomptePct: 30,
      clientId: martine.id,
      chantierId: chantier.id,
      dateReponse: new Date(),
      conditions:
        "Intervention du lundi au vendredi, 8h-17h. Évacuation des gravats incluse. Alimentation en eau et électricité fournie par le client.",
      lignes: {
        create: [
          {
            ordre: 0,
            designation: "Dépose de l'ancien carrelage et de la baignoire",
            categorie: "MAIN_OEUVRE",
            quantite: 2,
            unite: "j",
            prixUnitaireCents: 38000,
            tauxTva: 10,
          },
          {
            ordre: 1,
            designation: "Fourniture et pose de carrelage mural 30×60",
            categorie: "FOURNITURE",
            quantite: 18.5,
            unite: "m²",
            prixUnitaireCents: 7200,
            tauxTva: 10,
          },
          {
            ordre: 2,
            designation: "Installation douche à l'italienne avec receveur extra-plat",
            categorie: "FORFAIT",
            quantite: 1,
            unite: "forfait",
            prixUnitaireCents: 189000,
            tauxTva: 10,
          },
          {
            ordre: 3,
            designation: "Remplacement du chauffe-eau thermodynamique",
            categorie: "FOURNITURE",
            quantite: 1,
            unite: "u",
            prixUnitaireCents: 142000,
            tauxTva: 5.5,
          },
          {
            ordre: 4,
            designation: "Évacuation des gravats en déchetterie",
            categorie: "DEPLACEMENT",
            quantite: 2,
            unite: "u",
            prixUnitaireCents: 9500,
            tauxTva: 20,
          },
        ],
      },
    },
  });

  const dateEmission = new Date();
  const dateEcheance = new Date(dateEmission);
  dateEcheance.setDate(dateEcheance.getDate() + 30);

  const facture = await prisma.facture.create({
    data: {
      numero: `FA-${annee}-0001`,
      type: "ACOMPTE",
      statut: "ENVOYEE",
      verrouillee: true,
      objet: devis.objet,
      dateEmission,
      dateEcheance,
      clientId: martine.id,
      chantierId: chantier.id,
      devisId: devis.id,
      lignes: {
        create: [
          {
            ordre: 0,
            designation: `Acompte de 30 % sur devis ${devis.numero}`,
            categorie: "FORFAIT",
            quantite: 1,
            unite: "forfait",
            prixUnitaireCents: 156540,
            tauxTva: 10,
          },
        ],
      },
    },
  });

  await prisma.paiement.create({
    data: {
      factureId: facture.id,
      montantCents: 172194,
      mode: "VIREMENT",
      reference: "VIR-DUPONT-0426",
    },
  });

  await prisma.compteur.createMany({
    data: [
      { type: "DEVIS", annee, dernier: 1 },
      { type: "FACTURE", annee, dernier: 1 },
    ],
  });

  console.log("Jeu de démonstration créé.");
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
