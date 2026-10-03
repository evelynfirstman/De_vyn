-- Phase 6: Learn tab — videos, bookmarks, tag-based related content.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

UPDATE articles SET tags = '{posture,sitting}' WHERE slug = 'why-desk-strain-recurs';
UPDATE articles SET tags = '{sleep,recovery}' WHERE slug = 'sleep-and-recovery-score';

CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_sec INT NOT NULL DEFAULT 0,
  playback_url TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL DEFAULT 'recovery',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- playback_url stays NULL until R2 media lands (Phase 2b); app hides play until set.
INSERT INTO videos (slug, title, description, duration_sec, category, tags) VALUES
  ('desk-posture-reset-5min', '5-Minute Desk Posture Reset', 'Follow-along reset for neck and shoulders.', 300, 'guided', '{neck,shoulders,posture}'),
  ('lower-back-decompression', 'Lower Back Decompression', 'Gentle floor routine after long sitting.', 480, 'guided', '{lower-back,sitting}')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  kind TEXT NOT NULL CHECK (kind IN ('article', 'video')),
  ref_id INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, kind, ref_id)
);

CREATE INDEX IF NOT EXISTS bookmarks_user_idx
  ON bookmarks (user_id, kind);
