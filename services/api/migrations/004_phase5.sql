-- Phase 5: Recover tab — program filtering + session completions.

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS problem_tags TEXT[] NOT NULL DEFAULT '{}';

-- Backfill tags for seeded programs (idempotent).
UPDATE programs SET problem_tags = '{neck,shoulders,posture}'
  WHERE slug = 'neck-shoulder-reset' AND problem_tags = '{}';
UPDATE programs SET problem_tags = '{lower-back,sitting}'
  WHERE slug = 'lower-back-relief' AND problem_tags = '{}';

CREATE TABLE IF NOT EXISTS session_completions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  program_id INT NOT NULL REFERENCES programs (id),
  duration_sec INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS session_completions_user_idx
  ON session_completions (user_id, completed_at DESC);
