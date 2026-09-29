-- Vyn Therapy seed data (Phase 2). Loaded by postgres initdb on first `docker compose up`.
-- Business tables only; Better Auth tables arrive with auth wiring (Phase 2b).

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'all',
  duration_min INT NOT NULL DEFAULT 10,
  steps JSONB NOT NULL DEFAULT '[]',
  problem_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS articles (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'recovery',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  amount_minor INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  is_bundle BOOLEAN NOT NULL DEFAULT false,
  problem_tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO users (email, name) VALUES
  ('demo@vyntherapy.test', 'Demo User')
ON CONFLICT (email) DO NOTHING;

INSERT INTO programs (slug, title, description, level, duration_min, steps, problem_tags) VALUES
  ('neck-shoulder-reset', 'Neck & Shoulder Reset', 'Desk-strain relief for knowledge workers.', 'beginner', 12,
   '[{"name": "Chin tucks", "seconds": 60}, {"name": "Doorway chest stretch", "seconds": 90}, {"name": "Upper-trap stretch", "seconds": 120}]',
   '{neck,shoulders,posture}'),
  ('lower-back-relief', 'Lower Back Relief', 'Gentle decompression after long sitting.', 'beginner', 15,
   '[{"name": "Cat-cow", "seconds": 120}, {"name": "Child pose", "seconds": 120}, {"name": "Supine twist", "seconds": 120}]',
   '{lower-back,sitting}')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO articles (slug, title, excerpt, category) VALUES
  ('why-desk-strain-recurs', 'Why Desk Strain Keeps Coming Back', 'Posture, microbreaks and what actually helps.', 'education'),
  ('sleep-and-recovery-score', 'Sleep and Your Recovery Score', 'How sleep input shapes tomorrow’s plan.', 'education')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (sku, title, amount_minor, currency, is_bundle, problem_tags) VALUES
  ('VYN-NECK-001', 'Neck Relief Kit', 2500000, 'NGN', false, '{neck,posture}'),
  ('VYN-BACK-001', 'Lower Back Support Bundle', 4200000, 'NGN', true, '{lower-back,sitting}'),
  ('VYN-DESK-STARTER', 'Desk Worker Starter Bundle', 6500000, 'NGN', true, '{neck,lower-back,posture}')
ON CONFLICT (sku) DO NOTHING;
