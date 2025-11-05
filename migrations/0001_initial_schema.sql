-- LokoManager Database Schema v1.0
-- Migration: 0001 - Initial Schema
-- Created: 2025-01-05
-- Description: Tables principales pour gestion locative multi-tenant

-- ============================================================================
-- TABLE: owners (propriétaires/tenants)
-- ============================================================================
CREATE TABLE IF NOT EXISTS owners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  subscription_tier TEXT DEFAULT 'free' CHECK(subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: properties (biens immobiliers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  property_type TEXT NOT NULL CHECK(property_type IN ('villa', 'appartement', 'studio', 'bureau', 'commerce')),
  status TEXT DEFAULT 'vacant' CHECK(status IN ('vacant', 'occupied', 'maintenance')),
  total_units INTEGER DEFAULT 1,
  monthly_rent REAL,
  description TEXT,
  photos TEXT, -- JSON array of photo URLs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: tenants (locataires)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_card_number TEXT,
  move_in_date DATE NOT NULL,
  move_out_date DATE,
  monthly_rent REAL NOT NULL,
  deposit_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'evicted')),
  emergency_contact TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: rent_payments (paiements de loyer)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rent_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_date DATE,
  due_date DATE NOT NULL,
  payment_method TEXT CHECK(payment_method IN ('orange_money', 'mtn_money', 'moov_money', 'wave', 'cash', 'bank_transfer')),
  transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed', 'late', 'cancelled')),
  notes TEXT,
  receipt_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: notifications (notifications programmées)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  tenant_id INTEGER,
  type TEXT NOT NULL CHECK(type IN ('rent_reminder', 'late_payment', 'payment_received', 'maintenance', 'general')),
  channel TEXT NOT NULL CHECK(channel IN ('sms', 'whatsapp', 'email')),
  recipient_phone TEXT,
  recipient_email TEXT,
  message TEXT NOT NULL,
  scheduled_at DATETIME NOT NULL,
  sent_at DATETIME,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
  external_id TEXT,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE: expenses (dépenses/charges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  property_id INTEGER,
  category TEXT NOT NULL CHECK(category IN ('maintenance', 'taxes', 'insurance', 'utilities', 'repairs', 'other')),
  amount REAL NOT NULL,
  expense_date DATE NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT,
  paid_to TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
);

-- ============================================================================
-- TABLE: service_providers (artisans/fournisseurs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS service_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  specialty TEXT NOT NULL,
  rating INTEGER DEFAULT 0 CHECK(rating >= 0 AND rating <= 5),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

-- ============================================================================
-- INDEXES (optimisation des requêtes fréquentes)
-- ============================================================================

-- Indexes pour isolation multi-tenant
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_owner ON tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner ON rent_payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_notifications_owner ON notifications(owner_id);
CREATE INDEX IF NOT EXISTS idx_expenses_owner ON expenses(owner_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_owner ON service_providers(owner_id);

-- Indexes pour jointures fréquentes
CREATE INDEX IF NOT EXISTS idx_tenants_property ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON rent_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_property ON rent_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_expenses_property ON expenses(property_id);

-- Indexes pour requêtes de dashboard
CREATE INDEX IF NOT EXISTS idx_payments_status_date ON rent_payments(status, due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_status_scheduled ON notifications(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);

-- Index pour recherche email (login)
CREATE INDEX IF NOT EXISTS idx_owners_email ON owners(email);
