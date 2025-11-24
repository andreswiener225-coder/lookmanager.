-- CinetPay transactions table
CREATE TABLE IF NOT EXISTS cinetpay_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  owner_id INTEGER NOT NULL,
  property_id INTEGER NOT NULL,
  
  -- Transaction details
  transaction_id TEXT UNIQUE NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'XOF',
  
  -- CinetPay specific
  cpm_trans_id TEXT,
  cpm_site_id TEXT,
  payment_method TEXT,
  payment_token TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  
  -- Metadata
  description TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  
  -- Webhook data
  webhook_data TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Payment receipts table (for PDF generation)
CREATE TABLE IF NOT EXISTS payment_receipts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_id INTEGER NOT NULL,
  transaction_id INTEGER,
  
  -- Receipt details
  receipt_number TEXT UNIQUE NOT NULL,
  pdf_url TEXT,
  pdf_blob_key TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'generated', 'sent', 'failed')),
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  generated_at DATETIME,
  sent_at DATETIME,
  
  FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES cinetpay_transactions(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cinetpay_trans_payment ON cinetpay_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_cinetpay_trans_tenant ON cinetpay_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cinetpay_trans_status ON cinetpay_transactions(status);
CREATE INDEX IF NOT EXISTS idx_cinetpay_trans_transaction_id ON cinetpay_transactions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_payment ON payment_receipts(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_receipt_number ON payment_receipts(receipt_number);
