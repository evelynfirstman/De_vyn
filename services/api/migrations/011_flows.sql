-- Phase 13 (journey flows): onboarding fields, session feedback,
-- reminder prefs, product wishlist, program equipment.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS occupation TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS activity_level TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS products_owned TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE session_completions
  ADD COLUMN IF NOT EXISTS rating INT CHECK (rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS feedback TEXT NOT NULL DEFAULT '';

ALTER TABLE notification_prefs
  ADD COLUMN IF NOT EXISTS reminders BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_time TEXT NOT NULL DEFAULT '08:00';

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS equipment TEXT[] NOT NULL DEFAULT '{}';

-- Wishlist: products join articles/videos as bookmarkable kinds.
ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_kind_check;
ALTER TABLE bookmarks
  ADD CONSTRAINT bookmarks_kind_check CHECK (kind IN ('article', 'video', 'product'));
