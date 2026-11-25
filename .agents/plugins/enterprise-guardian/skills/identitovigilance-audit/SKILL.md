---
name: identitovigilance-audit
description: Audite et valide les règles d'identitovigilance, la conformité de l'identité patient (traits stricts, homonymes, détection de doublons) et la traçabilité des dossiers médicaux. À utiliser lors de la création ou modification des modules patients, admissions ou dossiers médicaux.
---

# Audit d'Identitovigilance & Sécurité Patient

L'identitovigilance est l'ensemble des mesures destinées à fiabiliser l'identification des usagers afin de prévenir les erreurs d'attribution d'actes médicaux, d'examens ou de prescriptions.

---

## 1. Les 5 Traits Stricts d'Identité

Toute fiche patient doit obligatoirement collecter et valider :
1. **Nom de naissance** (nom de famille légal, en lettres capitales, sans ajout marital).
2. **Prénom(s)** (dans l'ordre officiel de l'état civil, sans abréviation ni surnom).
3. **Date de naissance** (format normé ISO 8601 : `AAAA-MM-JJ`).
4. **Sexe à l'état civil** (`M`, `F`, ou `I` - indéterminé).
5. **Lieu de naissance** (code commune officiel / pays de naissance).

*Les noms d'usage (ex: nom marital) et prénoms usuels doivent vivre dans des champs séparés dédiés et ne jamais écraser les traits stricts.*

---

## 2. Détection Prédictive des Doublons & Rapprochement

Lors de la saisie d'un nouveau patient :
- **Calcul phonétique** : Appliquer un algorithme de comparaison phonétique (Soundex / Metaphone adapté) et une distance de Levenshtein sur le nom et prénom.
- **Score de similarité** :
  - Similarité > 85% avec même date de naissance = **Alerte Bloquante / Demande de confirmation formelle**.
  - Même date de naissance + même sexe + nom approchant = **Suspicion de collision**.
- **Gestion des Homonymes Stricts** :
  - Si deux patients possèdent exactement les mêmes nom, prénom et date de naissance :
    - Génération obligatoire d'un voyant visuel distinctif (ex: badge d'homonymie).
    - Utilisation systématique de l'IPP (Identifiant Permanent du Patient) ou matricule unique pour toute prescription.

---

## 3. Fusion et Rapprochement de Dossiers

Lorsqu'un doublon est confirmé entre deux dossiers A et B :
- **Traçabilité intégrale** :
  - Conserver l'historique de chaque identifiant.
  - Enregistrer un événement de fusion avec `auteur_id`, `motif` et `date_fusion`.
- **Réversibilité technique** :
  - Ne jamais détruire physiquement le dossier source (`DELETE`), marquer son statut `fusionne_vers = dossier_cible_id`.
  - Réattribuer les séjours, consultations, ordonnances et factures sans altérer l'auteur original des actes.
