# Enterprise & ERP Architecture Guardian

Plugin officiel pour Antigravity dédié à la rigueur d'ingénierie logicielle sur les systèmes critiques d'information (ERP, logistique médicale et industrielle, encaissement POS, applications mobiles déconnectées).

## Composants Inclus

### Règles (`rules/AGENTS.md`)
- Intégrité absolue des stocks (Vues SQL, interdiction d'update direct).
- Respect du FEFO (First Expired, First Out) pour les consommables et périssables.
- Monnaie strictement en entiers (interdiction des flottants).
- Horodatage serveur de référence (`enregistre_le`).
- Idempotence garantie (`uuid_client`).

### Compétences (`skills/`)
1. **`architecture-and-schema-audit`** : Audit systématique des tables SQL, contraintes, index et transactions.
2. **`offline-sync-validator`** : Validation de la file d'attente hors-ligne, rejeu idempotent et étanchéité des données locales.
3. **`fefo-stock-engine`** : Moteur d'allocation FEFO, gestion des périssables, alertes de réapprovisionnement et exclusions des périmés.
4. **`identitovigilance-audit`** : Respect des 5 traits stricts d'identité patient, détection phonétique de doublons et fusion réversible de dossiers.
5. **`pos-cash-integrity`** : Précision monétaire en entiers, gestion des encaissements multimodaux et clôtures de caisse (Ticket X & Z).
6. **`android-apk-diagnostic`** : Diagnostic de compilation Gradle, compatibilité JDK 17/21, signature d'APK et sécurisation WebView.
