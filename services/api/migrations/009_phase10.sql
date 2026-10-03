-- Phase 10: AI layer — tunable score weights, KB full-text retrieval.
-- (Vector embeddings arrive when an embedding provider is configured;
-- until then retrieval is Postgres full-text over approved docs.)

-- Tunable score weights. The seeded row reproduces v1 exactly; the API
-- reports version v1 while it is active, v2 once weights are customized.
CREATE TABLE IF NOT EXISTS score_configs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  weights JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO score_configs (name, weights, is_active) VALUES
  ('v1-defaults',
   '{"base": 35, "sleepHigh": 15, "sleepMid": 8, "sorenessPer": 4, "stressPer": 3, "completionPer": 3, "completionCap": 9, "highAt": 70, "midAt": 40, "streakBonusCap": 0}',
   true);

-- Full-text retrieval over the curated KB.
ALTER TABLE kb_documents ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE kb_documents
   SET search_vector = to_tsvector('english', title || ' ' || body)
 WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS kb_documents_search_idx
  ON kb_documents USING GIN (search_vector);

DROP TRIGGER IF EXISTS kb_documents_search_trigger ON kb_documents;
CREATE TRIGGER kb_documents_search_trigger
  BEFORE INSERT OR UPDATE OF title, body ON kb_documents
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, body);
