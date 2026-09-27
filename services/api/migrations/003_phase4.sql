-- Phase 4: daily check-ins + recovery score snapshots (Home tab).
-- One check-in per user per local date; score snapshot recomputed on submit.

CREATE TABLE IF NOT EXISTS check_ins (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  check_date DATE NOT NULL,
  soreness INT NOT NULL CHECK (soreness BETWEEN 1 AND 5),
  sleep_hours NUMERIC NOT NULL CHECK (sleep_hours BETWEEN 0 AND 24),
  stress INT NOT NULL CHECK (stress BETWEEN 1 AND 5),
  activity TEXT NOT NULL DEFAULT '',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, check_date)
);

CREATE INDEX IF NOT EXISTS check_ins_user_date_idx
  ON check_ins (user_id, check_date DESC);

CREATE TABLE IF NOT EXISTS recovery_scores (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  check_date DATE NOT NULL,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  band TEXT NOT NULL,
  inputs JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, check_date)
);

CREATE INDEX IF NOT EXISTS recovery_scores_user_date_idx
  ON recovery_scores (user_id, check_date DESC);
