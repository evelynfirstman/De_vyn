-- Baseline business tables (Phase 2).
-- Previously these were created only by seed.sql via the local Postgres
-- initdb hook (docker-entrypoint-initdb.d), so fresh databases (staging/prod)
-- had no `users`/`programs`/`articles`/`products` and 002_phase3.sql failed.
-- Now a real migration so every environment self-provisions. Schema matches
-- services/api/seed.sql; seed rows stay in seed.sql.

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
