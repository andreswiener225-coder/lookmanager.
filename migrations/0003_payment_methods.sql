-- Payment methods for owners (to receive payments)
CREATE TABLE IF NOT EXISTS owner_payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('orange_money', 'mtn_money', 'moov_money', 'wave', 'bank_transfer')),
  phone_number TEXT,
  account_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
);

-- Payment methods for tenants (to make payments)
CREATE TABLE IF NOT EXISTS tenant_payment_methods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('orange_money', 'mtn_money', 'moov_money', 'wave', 'bank_transfer')),
  phone_number TEXT,
  account_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  is_default INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_owner_payment_methods_owner ON owner_payment_methods(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_payment_methods_default ON owner_payment_methods(owner_id, is_default);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_methods_tenant ON tenant_payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payment_methods_default ON tenant_payment_methods(tenant_id, is_default);
