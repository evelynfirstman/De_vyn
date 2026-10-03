-- Phase 8: Progress + Profile — milestones, goals, notifications.

CREATE TABLE IF NOT EXISTS milestones (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  kind TEXT NOT NULL,
  label TEXT NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind)
);

CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  title TEXT NOT NULL,
  target_per_week INT NOT NULL DEFAULT 3,
  done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS goals_user_idx ON goals (user_id, created_at DESC);

-- Carry existing profile goal arrays into the goals table (one-off;
-- migrations run exactly once, so a plain INSERT is safe).
INSERT INTO goals (user_id, title)
  SELECT user_id, unnest(goals) FROM profiles WHERE goals <> '{}';

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  kind TEXT NOT NULL DEFAULT 'general',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx
  ON notifications (user_id, created_at DESC);
