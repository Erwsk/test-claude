# ArtiDevis

Outil de **devis et de facturation pour artisans du bâtiment**. Pensé pour être utilisé
depuis le chantier, sur téléphone : on saisit les lignes, l'application calcule la TVA
multi-taux, numérote le document et le sort en PDF prêt à envoyer.

## Pourquoi

Un artisan qui fait ses devis sur tableur perd du temps et prend des risques :
numérotation qui saute, TVA à 10 % et 5,5 % mélangées, mentions légales oubliées,
factures impayées qu'on ne voit passer qu'au moment du bilan. ArtiDevis règle
ces quatre points et rien d'autre.

## Ce que fait la V1

- **Clients** — carnet d'adresses particuliers / professionnels, réutilisable sur chaque document.
- **Devis** — lignes typées (main d'œuvre, fourniture, forfait, déplacement), remises de ligne
  et remise globale, acompte paramétrable, totaux et ventilation de TVA en direct pendant la saisie.
- **TVA bâtiment** — 20 %, 10 % (rénovation de plus de 2 ans), 5,5 % (rénovation énergétique),
  et autoliquidation pour la sous-traitance.
- **Factures** — création en un clic depuis un devis accepté : facture d'acompte, puis solde.
  Une facture envoyée est verrouillée (comme l'exige la réglementation).
- **Suivi des règlements** — le statut *payée / partielle / impayée* se déduit des paiements
  encaissés, il n'est jamais saisi à la main.
- **Sortie PDF** — mise en page A4 imprimable directement depuis le navigateur, mentions
  obligatoires incluses (SIRET, TVA, assurance décennale, pénalités de retard).
- **Numérotation continue** — séquence réservée en transaction, sans trou, remise à 1 chaque année.

## Démarrage

```bash
npm install
npm run dev         # http://localhost:3000
```

C'est tout : `npm run dev` crée au besoin le fichier `.env` et la base SQLite locale
avant de démarrer. Pour charger le jeu de démonstration (une entreprise, deux clients,
un devis accepté et sa facture d'acompte encaissée) :

```bash
npm run db:seed
```

Puis renseignez vos informations d'entreprise dans **Réglages** : elles alimentent
l'en-tête et le pied de tous les documents.

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement (prépare `.env` et la base au besoin) |
| `npm run setup` | Prépare `.env` et la base SQLite, sans rien écraser |
| `npm run build` | Build de production |
| `npm test` | Tests du cœur de calcul (Vitest) |
| `npm run typecheck` | Vérification TypeScript |
| `npm run db:push` | Synchronise le schéma Prisma avec la base |
| `npm run db:seed` | Charge le jeu de démonstration |
| `npm run db:studio` | Explorateur de base Prisma Studio |

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Prisma ·
SQLite en développement, PostgreSQL en production · Zod · Vitest.

## Organisation du code

```
src/lib/calculs.ts        Cœur métier : totaux, TVA, arrondis, échéances (couvert par les tests)
src/lib/numerotation.ts   Réservation transactionnelle des numéros de document
src/lib/validation.ts     Schémas Zod partagés client / serveur
src/app/actions.ts        Server Actions (création, statuts, paiements)
scripts/setup.mjs         Amorçage local idempotent (.env + base SQLite)
src/components/           Composants d'interface et rendu imprimable A4
prisma/schema.prisma      Modèle de données
```

**Règle centrale : tous les montants sont stockés et manipulés en centimes entiers.**
Aucun euro en virgule flottante ne traverse le code métier — c'est ce qui garantit qu'un
récapitulatif de TVA ne présente jamais un centime d'écart avec le total TTC.

Voir [`docs/SPEC.md`](docs/SPEC.md) pour le périmètre fonctionnel détaillé et
[`docs/ROADMAP.md`](docs/ROADMAP.md) pour la suite.

## Licence

Projet privé, tous droits réservés.
