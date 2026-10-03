-- Phase 11: growth — subscriptions, notification prefs, referrals.

CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  amount_minor INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  flutterwave_plan_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO subscription_plans (name, amount_minor, currency, interval) VALUES
  ('Vyn Premium Monthly', 1500000, 'NGN', 'month'),
  ('Vyn Premium Annual', 15000000, 'NGN', 'year');

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  plan_id INT NOT NULL REFERENCES subscription_plans (id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'cancelled')),
  tx_ref TEXT UNIQUE,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promo opt-out (repeat-purchase nudges respect this).
CREATE TABLE IF NOT EXISTS notification_prefs (
  user_id INT PRIMARY KEY REFERENCES users (id),
  promos BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Referral / advocacy loop.
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_user_id INT NOT NULL REFERENCES users (id),
  code TEXT UNIQUE NOT NULL,
  referred_user_id INT REFERENCES users (id),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'redeemed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
