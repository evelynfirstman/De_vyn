-- Phase 7: Shop tab — orders, payments, fulfillment outbox, QR codes.

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'paid', 'cancelled', 'fulfilled')),
  amount_minor INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  shipping JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_user_idx
  ON orders (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  unit_minor INT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL UNIQUE REFERENCES orders (id),
  provider TEXT NOT NULL DEFAULT 'flutterwave',
  tx_ref TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed')),
  raw JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fulfillment outbox: app order → bridge/Woo → TeemDrop (see plan Phase 7).
CREATE TABLE IF NOT EXISTS fulfillment_orders (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL UNIQUE REFERENCES orders (id),
  provider TEXT NOT NULL DEFAULT 'woo-bridge',
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'pushed', 'failed', 'awaiting-config')),
  bridge_ref TEXT,
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bundle_items (
  bundle_product_id INT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  member_sku TEXT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  PRIMARY KEY (bundle_product_id, member_sku)
);

-- Seed bundle membership (idempotent).
INSERT INTO bundle_items (bundle_product_id, member_sku, qty)
  SELECT id, 'VYN-NECK-001', 1 FROM products WHERE sku = 'VYN-BACK-001'
ON CONFLICT DO NOTHING;
INSERT INTO bundle_items (bundle_product_id, member_sku, qty)
  SELECT id, 'VYN-NECK-001', 1 FROM products WHERE sku = 'VYN-DESK-STARTER'
ON CONFLICT DO NOTHING;
INSERT INTO bundle_items (bundle_product_id, member_sku, qty)
  SELECT id, 'VYN-BACK-001', 1 FROM products WHERE sku = 'VYN-DESK-STARTER'
ON CONFLICT DO NOTHING;

-- Signed QR deep links to products / programs.
CREATE TABLE IF NOT EXISTS qr_codes (
  id SERIAL PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('product', 'program')),
  ref TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
