---
name: fefo-stock-engine
description: Spécifie et audite les règles d'allocation FEFO (First Expired, First Out), de gestion des périssables, alertes de réapprovisionnement et traçabilité des lots dans les environnements médicaux et industriels. À utiliser pour concevoir ou auditer la logique de sortie de stock et gestion de pharmacie/magasin.
---

# Moteur d'Allocation FEFO & Gestion des Périssables

Ce guide définit les règles strictes pour le traitement des stocks soumis à date de péremption (médicaments, réactifs de laboratoire, denrées, consommables critiques).

## 1. Règle d'Or FEFO (First Expired, First Out)

Pour toute demande de sortie, délivrance patient ou transfert :
1. **Priorité absolue à la date de péremption la plus courte** (`date_peremption ASC`).
2. En cas de dates de péremption identiques, appliquer le **FIFO** sur la date de réception (`enregistre_le ASC`).
3. **Exclusion automatique des lots périmés** : Tout lot dont `date_peremption <= CURRENT_DATE` est automatiquement exclu des propositions de sortie et dirigé vers le statut `quarantaine/périmé`.

```sql
-- Requête modèle pour proposer les lots à délivrer en FEFO
SELECT 
    m.produit_id,
    m.lot_id,
    l.numero_lot,
    l.date_peremption,
    SUM(CASE WHEN m.destination_id = :magasin_id THEN m.quantite ELSE -m.quantite END) as quantite_disponible
FROM mouvements m
JOIN lots l ON m.lot_id = l.id
WHERE m.produit_id = :produit_id
  AND (m.source_id = :magasin_id OR m.destination_id = :magasin_id)
  AND l.date_peremption > CURRENT_DATE
  AND l.est_bloque = 0
GROUP BY m.produit_id, m.lot_id, l.numero_lot, l.date_peremption
HAVING quantite_disponible > 0
ORDER BY l.date_peremption ASC, MIN(m.enregistre_le) ASC;
```

---

## 2. Sanctuarisation du Geste Métier

- **Signalement sans blocage** : Une alerte budgétaire, un dépassement de quota ou une anomalie administrative doit émettre une notification forte, mais ne doit **jamais** bloquer physiquement la délivrance d'un produit vital s'il est présent en rayon.
- Seule l'absence physique en stock constitue un verrou infranchissable.

---

## 3. Gestion des Déclarations de Rupture et Pertes

- Aucun stock négatif n'est autorisé.
- Si une délivrance physique doit avoir lieu alors que le lot n'a pas encore été administrativement réceptionné :
  - Enregistrer un mouvement d'ajustement signé avec motif `reception_urgente_a_regulariser`.
  - Horodater avec `enregistre_le = CURRENT_TIMESTAMP`.

---

## 4. Seuils d'Alerte Prédictifs

Pour chaque produit périssable :
- `seuil_reapprovisionnement` = (Consommation journalière moyenne × Délai de livraison fournisseur) + Stock de sécurité.
- `delai_alerte_peremption` = Nombre de jours avant péremption déclenchant la notification de déstockage prioritaire ou de retour fournisseur.
