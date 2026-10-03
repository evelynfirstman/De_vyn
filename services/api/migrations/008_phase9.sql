-- Phase 9: admin portal — AI KB review queue, support tickets, audit log.

CREATE TABLE IF NOT EXISTS kb_documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users (id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_user_idx
  ON support_tickets (user_id, created_at DESC);

-- RBAC audit trail: every admin write is logged (actor locks to real
-- identities when Better Auth + RBAC land in Phase 2b).
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL DEFAULT '',
  entity_id TEXT NOT NULL DEFAULT '',
  diff JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_created_idx
  ON audit_logs (created_at DESC);

-- QR scan analytics (incremented on resolve).
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS scans INT NOT NULL DEFAULT 0;

INSERT INTO kb_documents (title, body, source, status) VALUES
  ('Neck strain basics', 'Desk-related neck strain responds to chin tucks, trap stretches and microbreaks.', 'physio review', 'approved'),
  ('Sleep hygiene draft', 'Draft: sleep timing guidance pending review.', 'coach notes', 'draft');
