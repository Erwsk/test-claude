# Spécification fonctionnelle — ArtiDevis

## Utilisateur cible

Artisan du bâtiment seul ou avec 1 à 5 salariés : plaquiste, plombier, électricien,
maçon, peintre, carreleur. Fait entre 5 et 40 devis par mois. Travaille surtout
depuis son téléphone, souvent hors connexion stable, avec des mains sales et une
seule main disponible.

Conséquences directes sur le produit :
- interface utilisable au pouce, cibles tactiles larges, navigation basse sur mobile ;
- aucune saisie redondante : le devis accepté devient la facture sans ressaisie ;
- rien qui exige un ordinateur pour terminer une tâche courante.

## Parcours principal

1. L'artisan visite le chantier et crée un **devis** : client, objet, lignes de prestation.
2. Il l'envoie au client (PDF) et le marque **envoyé**.
3. Le client accepte → statut **accepté**.
4. L'artisan génère la **facture d'acompte** (30 % par défaut) et l'encaisse.
5. Travaux terminés → **facture de solde**, acompte déduit.
6. Il enregistre le règlement ; la facture passe automatiquement à **payée**.

## Règles métier

### Montants
Tous les montants sont stockés en **centimes entiers**. Les prix unitaires sont saisis
en euros et convertis immédiatement. L'arrondi est commercial : 0,5 s'éloigne de zéro.

### TVA
Quatre taux : 20 % (normal), 10 % (rénovation d'un logement de plus de 2 ans),
5,5 % (rénovation énergétique), 0 % (exonéré). Le taux se choisit **par ligne** :
un même devis mélange couramment 10 % sur la pose et 5,5 % sur l'équipement.

La remise globale est répartie proportionnellement sur chaque base de TVA, et le
reliquat d'arrondi est absorbé par la base la plus élevée. La somme des bases est
donc toujours strictement égale au total HT affiché.

En **autoliquidation** (sous-traitance BTP, art. 283-2 nonies du CGI), toutes les
lignes basculent à 0 % et la mention obligatoire apparaît en pied de document.

### Numérotation
Format `DEV-2026-0001` / `FA-2026-0001`. La séquence est réservée dans la même
transaction que la création du document : deux documents créés simultanément ne
peuvent pas porter le même numéro. Remise à 1 chaque année civile.

### Statuts
| Document | Statuts |
| --- | --- |
| Devis | brouillon → envoyé → accepté / refusé / expiré |
| Facture | brouillon → envoyée → payée en partie / payée / impayée |

Le statut de règlement d'une facture n'est **jamais saisi** : il se déduit du total
encaissé et de la date d'échéance.

### Verrouillage
Une facture marquée envoyée devient non modifiable. Toute correction passe par un
avoir — c'est une obligation légale, pas une préférence de conception.

### Délais
Le délai de paiement est plafonné à 60 jours (art. L441-10 du Code de commerce).
La validité d'un devis est de 30 jours par défaut.

## Mentions obligatoires sur les documents

SIRET · numéro de TVA intracommunautaire (ou mention « TVA non applicable, art. 293 B
du CGI ») · adresse et coordonnées · assurance décennale (assureur, n° de contrat,
couverture géographique) · pénalités de retard · indemnité forfaitaire de recouvrement
de 40 € · mention d'autoliquidation le cas échéant.

## Hors périmètre V1

Multi-utilisateurs et authentification · relances automatiques par e-mail · signature
électronique · comptabilité et export FEC · gestion de stock · planning d'équipe ·
application native · mode hors ligne.
