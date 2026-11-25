---
name: offline-sync-validator
description: Valide la robustesse des files d'attente hors-ligne, la synchronisation bidirectionnelle, la gestion des conflits et l'idempotence des opérations pour les applications mobiles et terminaux POS déconnectés.
---

# Validation des Mécanismes Hors-Ligne (Offline Sync)

Ce guide décrit les critères stricts pour certifier qu'une application (mobile Android, caisse POS, tablette terrain) peut fonctionner hors-ligne sans risque de désynchronisation ni de corruption de données.

## 1. Idempotence Réseau & Rejeu de Requêtes

Lorsqu'un terminal retrouve du réseau, il rejoue une file d'attente de requêtes. Pour prévenir tout double encaissement ou double déstockage :

- **Clé d'idempotence unique (`uuid_client`)** :
  - Générée par le client (UUID v4) au moment exact de l'action utilisateur locale.
  - Stockée dans la base locale (IndexedDB / SQLite local).
  - Transmise dans le corps ou l'en-tête de la requête HTTP.
- **Vérification côté serveur** :
  - La base centrale possède une contrainte `UNIQUE (uuid_client)`.
  - En cas de doublon reçu, le serveur renvoie un code `200 OK` avec le résultat déjà calculé, sans réexécuter l'action métier.

## 2. Ordre de Traitement & Horodatage

- La file d'attente locale doit être rejouée dans l'ordre chronologique strict de sa création (`saisi_le` local).
- Le serveur enregistre deux horodatages distincts :
  - `saisi_le` : date locale fournie par le client (à titre informatif).
  - `enregistre_le` : date serveur lors de l'insertion (date légale et de référence).

## 3. Stratégie de Résolution de Conflits

- Pour les **mouvements de stocks et transactions financières** :
  - Ne jamais écraser avec la règle « le dernier arrivant gagne » (Last-Write-Wins).
  - Si un lot est tombé à 0 pendant que le client était déconnecté, la délivrance est enregistrée en écart d'inventaire ou alerte prioritaire pour le pharmacien/gestionnaire, mais l'acte de soin ou de vente n'est jamais effacé rétroactivement de manière silencieuse.

## 4. Tests de Charge et Scénarios de Rupture Réseau

Avant toute mise en production d'une version mobile / POS :
1. Simuler une coupure réseau brutale en plein milieu d'une transaction.
2. Forcer l'envoi de la même file d'attente deux fois de suite et vérifier l'égalité exacte des stocks finaux.
3. Vérifier que la mémoire du terminal reste stable (pas de fuite mémoire liée à la file d'attente locale accumulée).
