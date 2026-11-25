# 🏪 Boutique Pro SaaS — Plateforme Industrielle Bimodale de Gestion & Caisse POS

Plateforme SaaS multi-tenant tout-en-un conçue pour opérer simultanément sur les **marchés locaux (Afrique / PME physiques en mode Local-First)** et à **l'international / diaspora (cartes bancaires en ligne)**.

---

## 🛡️ Les 4 Piliers Industriels Déployés

1. **Moteur Local-First & Synchronisation Asynchrone :**
   * L'application de caisse Flutter enregistre les ventes immédiatement en local avec génération d'UUID v4 hors-ligne.
   * File d'attente Outbox qui synchronise automatiquement les ventes vers l'API NestJS (`POST /v1/invoices/sync-batch`) dès que la 4G/Wi-Fi redevient disponible.
   * **Idempotence garantie :** Aucun risque de doublon de vente ou de stock lors des reconnexions.

2. **Chaînage Cryptographique Inviolable (Norme NF525 & Anti-Fraude Interne) :**
   * Chaque facture intègre le hash SHA-256 de la facture précédente :
     $$\text{Hash}_N = \text{SHA-256}(\text{Hash}_{N-1} + \text{Numéro} + \text{Séquence} + \text{Date} + \text{TotalTTC} + \text{TenantId})$$
   * Toute tentative de suppression ou de modification d'une vente passée par un employé brise la chaîne mathématique et déclenche une alerte de fraude.

3. **Monétisation Bimodale (Stripe / Whop + Mobile Money / Clés Prépayées) :**
   * **Piste A (En Ligne) :** Abonnements automatisés par carte bancaire via Stripe Checkout et licences Whop.
   * **Piste B (Terrain Local) :** Générateur de clés de licences chiffrées HMAC (`BP-<PLAN>-<BLOC>-<SIGNATURE>`) activables par un commerçant ayant payé en espèces ou par Mobile Money (Orange Money, MTN, Wave).

4. **Haute Disponibilité Hostinger VPS avec PgBouncer :**
   * Multiplexeur de connexions SQL PgBouncer inséré devant PostgreSQL 16 pour absorber des milliers de requêtes de synchronisation simultanées sur un VPS 2 à 4 vCPUs sans saturer la RAM.

---

## 🏛️ Architecture du Monorepo

```
boutique-pro-saas/
├── infra/
│   ├── docker-compose.yml          # PostgreSQL 16 + PgBouncer + Redis 7 + NestJS + Nginx
│   ├── database/init.sql           # Schéma DDL avec RLS, chaînage fiscal et audit_logs
│   ├── nginx/conf.d/default.conf   # Reverse Proxy Nginx, SSL Let's Encrypt & Rate Limiting
│   └── scripts/                    # Scripts de déploiement (deploy.sh) et backup (backup-db.sh)
│
├── apps/
│   ├── backend-nestjs/             # API Core REST NestJS 10
│   │   ├── src/modules/auth/       # Authentification JWT, RBAC & Vérification PIN Caisse
│   │   ├── src/modules/invoices/   # Ingestion en lot idempotente & Chaînage SHA-256
│   │   ├── src/modules/billing/    # Webhooks Stripe, Whop & LicenseTokenService
│   │   ├── src/modules/stocks/     # Verrouillage pessimiste SQL (FOR UPDATE)
│   │   └── src/modules/finance/    # Rapprochement de caisse par opérateur et moyen de paiement
│   │
│   ├── portal-nextjs/              # Portail Marketing & Dashboard SaaS (Next.js 14)
│   │   ├── src/app/page.tsx        # Landing Page commerciale
│   │   ├── src/app/(marketing)/pricing/ # Tarification avec déclencheur Stripe Checkout
│   │   └── src/app/(dashboard)/admin/   # Console SaaS (MRR, Churn, ARR)
│   │
│   └── mobile-desktop-flutter/     # Application Caisse POS Multiplateforme
│       ├── lib/core/services/      # OfflineSyncService (Outbox Queue) & ThermalPrinterService
│       └── lib/presentation/       # Écran POS avec badge de statut réseau temps réel
│
└── .github/workflows/deploy.yml    # Pipeline CI/CD GitHub Actions
```

---

## 🚀 Mise en Route & Exploitation

### 1. Démarrage Local
```bash
cd infra
cp .env.example .env
docker compose up -d
```
* **API NestJS** : `http://localhost:3000/v1`
* **Portail Next.js** : `http://localhost:3001`
* **PgBouncer (SQL Pool)** : `localhost:5432`

### 2. Émission d'une Clé de Licence Prépayée (Administration)
Pour générer une clé d'activation pour un commerçant local ayant payé en espèces :
```bash
curl -X POST http://localhost:3000/v1/billing/license/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN_ADMIN>" \
  -d '{"plan": "PRO", "durationDays": 30}'
```
Réponse générée : `{"licenseKey": "BP-PRO-A4F1-8B29D3E1FA0294C1", "durationDays": 30}`

Le commerçant entre simplement cette clé dans son interface pour activer sa boutique pendant 30 jours.

### 3. Compilation Flutter
```bash
cd apps/mobile-desktop-flutter
flutter pub get
flutter build apk --release      # Terminal tactile Android
flutter build windows --release  # PC Caisse Windows
```
