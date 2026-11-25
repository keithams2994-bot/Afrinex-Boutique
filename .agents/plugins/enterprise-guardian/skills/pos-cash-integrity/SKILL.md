---
name: pos-cash-integrity
description: Valide l'intégrité financière des points de vente (POS), le calcul d'arrondis en centimes entiers, la gestion des modes de règlement multiples, et la conformité des clôtures de caisse (Ticket X et Z). À utiliser lors du développement ou de la refactorisation des caisses enregistreuses et passerelles de paiement.
---

# Intégrité Financière & Clôtures de Caisse POS

Ce guide formule les règles de rigueur comptable indispensables pour garantir l'absence d'écarts de caisse et la traçabilité fiscale des encaissements.

---

## 1. Règle Absolue : Valeurs Monétaires en Entiers

- **Zéro flottant (pas de `float` ni `double`)** : Tout montant (prix unitaire, taux de taxe, sous-total, remise, montant perçu, rendu de monnaie) est manipulé et stocké sous forme d'**entier** représentant la plus petite sous-unité monétaire (ex: centimes pour EUR/USD, ou francs guinéens/CFA entiers).
- **Calculs de TVA et taxes** :
  ```typescript
  // Exemple de calcul de taxe sécurisé en entiers
  function calculerTva(montantHtCentimes: number, tauxTvaBasisPoints: number): number {
    // 20% TVA = 2000 basis points (100% = 10000)
    return Math.round((montantHtCentimes * tauxTvaBasisPoints) / 10000);
  }
  ```

---

## 2. Modes de Règlement Multiples & Rendu Monnaie

- Une vente peut être soldée par plusieurs modes (Exemple : Espèces + Carte Bancaire + Mobile Money).
- **Règle d'équilibre** :
  $$\sum \text{Paiements Perçus} - \text{Rendu de Monnaie} = \text{Total Vente TTC}$$
- Le rendu de monnaie n'est autorisé que sur le mode `ESPECES`.

---

## 3. Clôture de Caisse et Journal d'Audit

1. **Ticket X (Clôture intermédiaire)** :
   - Lecture non destructrice des totaux de la session en cours.
   - Ne réinitialise pas les compteurs de session.
2. **Ticket Z (Clôture journalière définitive)** :
   - Fige définitivement la session de caisse avec horodatage serveur `enregistre_le`.
   - Calcule le **fond de caisse initial**, les **encaissements théoriques**, et compare avec le **comptage réel physique**.
   - Tout écart (manquant ou surplus) génère une ligne d'écart non modifiable avec justification obligatoire du caissier.
   - Scelle la session : aucun nouveau ticket ne peut être rattaché à une session après un Z.
