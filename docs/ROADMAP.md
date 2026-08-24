# Feuille de route

## V1 — socle (fait)

- [x] Modèle de données complet (clients, chantiers, devis, factures, paiements, photos)
- [x] Cœur de calcul : TVA multi-taux, remises, arrondis, échéances — couvert par les tests
- [x] Numérotation séquentielle transactionnelle
- [x] Création de clients et de devis, totaux en direct pendant la saisie
- [x] Conversion devis → facture d'acompte puis solde
- [x] Suivi des règlements et statuts déduits
- [x] Rendu A4 imprimable avec mentions obligatoires
- [x] Réglages entreprise

## V1.1 — utilisable au quotidien

- [ ] Authentification (un compte = un artisan) et hébergement multi-locataire
- [ ] Modification d'un devis en brouillon (aujourd'hui : création seule)
- [ ] Duplication d'un devis existant
- [ ] Bibliothèque de prestations récurrentes, avec prix par défaut
- [ ] Photos de chantier : capture depuis le téléphone, avant / pendant / après
- [ ] Envoi du PDF par e-mail depuis l'application

## V1.2 — l'argent rentre plus vite

- [ ] Relance automatique des factures impayées (J+7, J+15, J+30)
- [ ] Signature électronique du devis par le client, depuis un lien
- [ ] Paiement en ligne de l'acompte (Stripe)
- [ ] Factures de situation (avancement en %) pour les chantiers longs
- [ ] Avoirs

## V2 — gestion d'entreprise

- [ ] Tableau de bord : chiffre d'affaires, taux de transformation des devis, marge par chantier
- [ ] Export comptable (FEC) et transmission au cabinet
- [ ] Facturation électronique (Factur-X / PDP), obligatoire pour les TPE à partir de septembre 2027
- [ ] Suivi des achats et des fournisseurs
- [ ] Multi-utilisateurs : accès salariés en lecture, pointage des heures par chantier

## Dette technique connue

- Passer de SQLite à PostgreSQL avant toute mise en production multi-utilisateur.
- Les totaux sont recalculés à chaque affichage de liste : à mettre en cache le jour où
  un artisan dépassera quelques centaines de documents.
- Le PDF passe par l'impression navigateur. Suffisant pour la V1, à remplacer par un
  rendu serveur le jour où l'envoi par e-mail arrive.
