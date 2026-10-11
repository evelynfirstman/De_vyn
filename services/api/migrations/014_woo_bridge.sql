-- WooCommerce bridge (Phase 7): tracking pull-back + retry worker support.

ALTER TABLE fulfillment_orders
  ADD COLUMN IF NOT EXISTS woo_status TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT,
  ADD COLUMN IF NOT EXISTS carrier TEXT,
  ADD COLUMN IF NOT EXISTS last_polled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS fulfillment_orders_status_idx
  ON fulfillment_orders (status, updated_at);
