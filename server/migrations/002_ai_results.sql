CREATE TABLE IF NOT EXISTS ai_results (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  endpoint TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_results_user_created_idx
  ON ai_results (user_id, created_at DESC);
