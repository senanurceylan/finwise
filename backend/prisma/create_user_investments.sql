CREATE TABLE IF NOT EXISTS user_investments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  asset_type VARCHAR(20) NOT NULL,
  quantity NUMERIC(18, 8) NOT NULL CHECK (quantity > 0),
  buy_price_try NUMERIC(18, 4) NOT NULL CHECK (buy_price_try >= 0),
  note VARCHAR(300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_investments_user_id ON user_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_investments_symbol ON user_investments(symbol);
