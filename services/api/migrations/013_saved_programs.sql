-- Phase 13b: saved programs (wishlist for programs).

ALTER TABLE bookmarks DROP CONSTRAINT IF EXISTS bookmarks_kind_check;
ALTER TABLE bookmarks
  ADD CONSTRAINT bookmarks_kind_check CHECK (kind IN ('article', 'video', 'product', 'program'));
