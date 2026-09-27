-- Phase 3: profile → assessment → recovery plan (journey steps 4–6).
-- Applied by the API migration runner (see src/migrate.ts), tracked in schema_migrations.

CREATE TABLE IF NOT EXISTS profiles (
  user_id INT PRIMARY KEY REFERENCES users (id),
  goals TEXT[] NOT NULL DEFAULT '{}',
  pain_areas TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT[] NOT NULL DEFAULT '{}',
  minutes_per_session INT NOT NULL DEFAULT 15,
  days_per_week INT NOT NULL DEFAULT 3,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  soreness INT NOT NULL CHECK (soreness BETWEEN 1 AND 5),
  sleep_hours NUMERIC NOT NULL CHECK (sleep_hours BETWEEN 0 AND 24),
  stress INT NOT NULL CHECK (stress BETWEEN 1 AND 5),
  activity TEXT NOT NULL DEFAULT '',
  pain_areas TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assessments_user_created_idx
  ON assessments (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS recovery_plans (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  assessment_id INT NOT NULL REFERENCES assessments (id),
  items JSONB NOT NULL DEFAULT '[]',
  rationale TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recovery_plans_user_created_idx
  ON recovery_plans (user_id, created_at DESC);
