-- ==============================================================================
-- BOUTIQUE PRO SAAS - SCHÉMA DDL POSTGRESQL 16 INDUSTRIEL MULTI-TENANT (RLS)
-- AVEC CHAÎNAGE CRYPTOGRAPHIQUE NF525 & GESTION DES LICENCES PRÉPAYÉES
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Table des Entreprises Abonnées (Tenants)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    currency VARCHAR(10) DEFAULT 'GNF',
    tax_rate NUMERIC(5, 4) DEFAULT 0.1800,
    subscription_plan VARCHAR(50) DEFAULT 'FREE', -- FREE, PRO, ENTERPRISE
    subscription_status VARCHAR(50) DEFAULT 'TRIAL', -- TRIAL, ACTIVE, PAST_DUE, CANCELED
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    whop_membership_id VARCHAR(100),
    rccm VARCHAR(100),
    nif VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Types Énumérés
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'AGENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_type AS ENUM ('TICKET', 'FACTURE', 'PROFORMA', 'BON_COMMANDE', 'AVOIR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE invoice_status AS ENUM ('PAID', 'PENDING', 'CREDIT', 'CANCELED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stock_reason AS ENUM ('VENTE', 'REASSORT', 'PERTE', 'INVENTAIRE', 'RETOUR_CLIENT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Table des Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role DEFAULT 'AGENT',
    pin_code_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Fiches Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(150),
    tax_id VARCHAR(50),
    credit_balance NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Catalogue Produits
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    barcode VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Général',
    cost_price NUMERIC(15, 2) DEFAULT 0.00,
    sale_price NUMERIC(15, 2) NOT NULL,
    current_stock INT DEFAULT 0,
    alert_threshold INT DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Factures & Pièces Comptables (avec Chaînage Cryptographique Inviolable)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    client_id UUID REFERENCES clients(id),
    invoice_number VARCHAR(100) NOT NULL,
    sequence_number INT NOT NULL,
    type invoice_type NOT NULL,
    status invoice_status NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    total_ht NUMERIC(15, 2) NOT NULL,
    total_tax NUMERIC(15, 2) NOT NULL,
    total_ttc NUMERIC(15, 2) NOT NULL,
    reference_invoice_id UUID REFERENCES invoices(id),
    notes TEXT,
    previous_hash VARCHAR(64) NOT NULL, -- Hash SHA-256 du ticket précédent
    current_hash VARCHAR(64) NOT NULL,  -- Hash SHA-256 calculé de ce ticket
    client_uuid UUID,                   -- Idempotence lors de la synchro hors-ligne
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL,
    cost_price NUMERIC(15, 2) NOT NULL,
    quantity INT NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL
);

-- 7. Journal des Mouvements de Stock
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    quantity_delta INT NOT NULL,
    reason stock_reason NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Registre des Dépenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    label VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Licences Prépayées (Encaissement Espèces / Mobile Money Terrain)
CREATE TABLE IF NOT EXISTS license_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    license_key VARCHAR(100) UNIQUE NOT NULL,
    plan VARCHAR(50) NOT NULL DEFAULT 'PRO',
    duration_days INT NOT NULL DEFAULT 30,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    is_redeemed BOOLEAN DEFAULT FALSE,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    signature VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Registre Immuable d'Audit de Sécurité Caisse (Anti-Fraude Employés)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL, -- 'DRAWER_OPENED_NO_SALE', 'VOID_ATTEMPT', 'PRICE_OVERRIDE'
    details JSONB NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEX COMPOSITES HAUTE PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_invoices_chain ON invoices(tenant_id, sequence_number DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_client_uuid ON invoices(tenant_id, client_uuid);
CREATE INDEX IF NOT EXISTS idx_license_keys_search ON license_keys(license_key);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);

-- ==============================================================================
-- POLITIQUES ROW-LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS client_isolation ON clients;
    CREATE POLICY client_isolation ON clients
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

    DROP POLICY IF EXISTS product_isolation ON products;
    CREATE POLICY product_isolation ON products
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

    DROP POLICY IF EXISTS invoice_isolation ON invoices;
    CREATE POLICY invoice_isolation ON invoices
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

    DROP POLICY IF EXISTS invoice_items_isolation ON invoice_items;
    CREATE POLICY invoice_items_isolation ON invoice_items
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

    DROP POLICY IF EXISTS stock_movements_isolation ON stock_movements;
    CREATE POLICY stock_movements_isolation ON stock_movements
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

    DROP POLICY IF EXISTS expenses_isolation ON expenses;
    CREATE POLICY expenses_isolation ON expenses
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

    DROP POLICY IF EXISTS audit_logs_isolation ON audit_logs;
    CREATE POLICY audit_logs_isolation ON audit_logs
        USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
END $$;
