# Doctrine d'Intégrité des Systèmes d'Information Critiques

Ce règlement s'applique à tous les développements portant sur les architectures de gestion de stocks, logistique médicale/industrielle, caisses POS et systèmes synchronisés hors-ligne.

## 1. Intégrité Absolue des Données & Stocks

- **Zéro écriture directe sur les stocks** : Les stocks réels ne sont jamais stockés dans une table modifiable directement par `UPDATE` ou `INSERT`. Les stocks doivent être calculés via une **VUE SQL** à partir du journal des mouvements horodatés et signés (Audit Trail / Event Sourcing).
- **Quantités toujours positives** : La colonne de quantité d'un mouvement est strictement positive (`quantite > 0`). Le sens du flux est déterminé par les colonnes `source_id` et `destination_id` avec contraintes `CHECK`.
- **Interdiction formelle des montants en flottants** : Toutes les valeurs monétaires sont exprimées en **entiers** (centimes, plus petite unité de devise). Aucun type `FLOAT`, `DOUBLE` ou flottant IEEE 754 ne doit être utilisé pour de l'argent.
- **Horodatage serveur faisant foi** : `enregistre_le` (généré par le serveur lors de la réception) fait juridiquement foi, et non `saisi_le` (qui peut provenir d'un terminal hors ligne ou déréglé).

## 2. Règle FEFO & Gestion des Périssables

- **FEFO (First Expired, First Out) obligatoire** : Pour tout mouvement de sortie ou délivrance de produits périssables (médicaments, réactifs, consommables), la priorité absolue de délivrance est donnée au lot dont la date de péremption est la plus proche.
- **Zéro rupture, zéro périmé** : Prévoir des alertes prédictives sur le seuil de réapprovisionnement et le délai avant péremption sans jamais bloquer l'accès aux fournitures indispensables.

## 3. Idempotence & Synchronisation Hors-Ligne

- **UUID Client unique** : Toute transaction ou mouvement initié sur un client hors-ligne (terminal de caisse, application mobile/tablette) doit posséder un identifiant `uuid_client` généré à la création.
- **Rejeu idempotent** : Le backend doit garantir qu'un rejeu réseau ou une synchronisation multiple avec le même `uuid_client` n'insère jamais de doublon.
- **Propriété exclusive de la base de données locale** : Le processus serveur est le propriétaire unique du fichier SQLite local. Aucun accès concurrent direct par partage de fichier (NFS/SMB) ne doit être autorisé.

## 4. Analyse Systématique & Prévention des Régressions

- **Avant toute modification de schéma ou de logique métier** :
  1. Identifier les impacts sur les vues SQL et les calculs de stock en cascade.
  2. Valider le comportement en cas de coupure réseau (mode dégradé / offline).
  3. Vérifier la rétrocompatibilité des migrations de base de données.
