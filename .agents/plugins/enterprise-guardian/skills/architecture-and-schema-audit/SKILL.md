---
name: architecture-and-schema-audit
description: Audite et valide les schémas SQL, migrations, vues et contraintes de tables dans les systèmes critiques (ERP, santé, caisse POS). À utiliser lors de modifications de base de données, création de tables ou refactorisation de logique de stockage.
---

# Audit d'Architecture et de Schéma de Données

Ce guide fournit la méthodologie rigoureuse pour auditer une base de données ou une migration dans un environnement ERP ou hospitalier critique.

## Checklist d'Audit Obligatoire

Lors de l'analyse ou de la création de schémas de données :

### 1. Modélisation des Stocks et Mouvements
- [ ] Le stock actuel est-il une **VUE SQL** et non une table statique ?
- [ ] Aucun trigger `INSTEAD OF` n'est présent sur la vue de stock (garantissant l'impossibilité de modifier le stock directement).
- [ ] La table des mouvements dispose d'un index composite sur `(produit_id, lot_id, date_peremption)`.
- [ ] La contrainte `CHECK (quantite > 0)` est explicitement déclarée.
- [ ] Le sens du mouvement est validé :
  - Entrée : `source_id IS NULL AND destination_id IS NOT NULL`
  - Sortie/Délivrance : `source_id IS NOT NULL AND destination_id IS NULL`
  - Transfert interne : `source_id IS NOT NULL AND destination_id IS NOT NULL AND source_id <> destination_id`

### 2. Typage et Intégrité Monétaire
- [ ] Aucune colonne monétaire n'utilise de type flottant (`REAL`, `FLOAT`, `DOUBLE`).
- [ ] Toutes les valeurs de prix ou montants sont en entiers (`INTEGER` ou `BIGINT`) représentant la plus petite sous-unité monétaire.
- [ ] Les devises et formats régionaux sont paramétrables et non écrits en dur.

### 3. Traçabilité et Audit Trail
- [ ] Chaque table critique comporte :
  - `cree_le` ou `enregistre_le` (horodatage UTC serveur par défaut).
  - `cree_par` ou `utilisateur_id` (signature de l'auteur).
- [ ] Les suppressions physiques (`DELETE`) sont proscrites sur les tables d'audit et remplacées par un archivage ou une annulation par contre-passation.

### 4. Transactions et SQLite Locks
- [ ] Utilisation systématique de transactions explicites (`BEGIN IMMEDIATE` pour SQLite) lors d'écritures pour éviter les `SQLITE_BUSY`.
- [ ] Mode WAL (Write-Ahead Logging) activé : `PRAGMA journal_mode = WAL;`.
