-- Supabase schema for Realestate app
-- Run this in the Supabase SQL editor (or psql) to create necessary tables and relations.
-- This schema assumes you use Supabase Auth; profiles will reference auth.users(id).

-- Ensure UUID generation function is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUM types
CREATE TYPE txn_status AS ENUM ('pending','completed','failed','cancelled');
CREATE TYPE txn_type AS ENUM ('deposit','withdrawal','investment','payout','fee','refund');
CREATE TYPE investment_status AS ENUM ('pending','active','completed','cancelled','failed');
CREATE TYPE risk_level AS ENUM ('low','medium','high','unknown');

-- Roles table (optional, attach roles to profiles)
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Profiles (linked to Supabase Auth user)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  avatar_url text,
  phone text,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cryptos table (optional duplicate/denormalized store if you want quick SQL access)
-- Note: master content can remain in Sanity; use `sanity_id` to link.
CREATE TABLE IF NOT EXISTS cryptos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sanity_id text UNIQUE,
  symbol varchar(16) NOT NULL,
  name text NOT NULL,
  price numeric(30,8) DEFAULT 0,
  description text,
  change_24h numeric(10,6),
  expected_roi numeric(8,2),
  risk_level risk_level DEFAULT 'unknown',
  min_investment numeric(30,8) DEFAULT 0,
  market_cap numeric(30,2) DEFAULT 0,
  logo_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cryptos_symbol ON cryptos(symbol);
CREATE INDEX IF NOT EXISTS idx_cryptos_marketcap ON cryptos(market_cap DESC);

-- Properties table (denormalized small store for SQL queries referencing Sanity content)
-- Keep `sanity_id` so you don't duplicate full CMS content unless needed.
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sanity_id text UNIQUE,
  title text,
  location text,
  price numeric(30,2),
  currency varchar(8) DEFAULT 'USD',
  thumbnail_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_properties_sanity_id ON properties(sanity_id);

-- Transactions (generic ledger for deposits/withdrawals/investments/payouts)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type txn_type NOT NULL,
  amount numeric(30,8) NOT NULL,
  currency varchar(16) DEFAULT 'USD',
  status txn_status DEFAULT 'pending',
  provider varchar(128), -- e.g., 'stripe','paystack','coinbase','onchain'
  provider_txn_id text,
  related_object jsonb, -- e.g., {"crypto_id": "...", "property_sanity_id": "..."}
  fees numeric(30,8) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Investments (user investments in cryptos or properties)
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  crypto_id uuid REFERENCES cryptos(id) ON DELETE SET NULL,
  property_sanity_id text, -- link to Sanity property document if investing in a property
  amount numeric(30,8) NOT NULL,
  units numeric(30,8), -- e.g., tokens or share units
  status investment_status DEFAULT 'pending',
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_crypto ON investments(crypto_id);

-- Deposits & Withdrawals could be represented in `transactions`, but add helpers table for on-chain operations
CREATE TABLE IF NOT EXISTS onchain_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  chain varchar(64), -- e.g., 'polygon','ethereum','btc'
  tx_hash text,
  from_address text,
  to_address text,
  confirmations integer DEFAULT 0,
  status txn_status DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onchain_tx_hash ON onchain_transfers(tx_hash);

-- Wallets (user saved wallets)
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text,
  address text NOT NULL,
  chain varchar(64),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Saved properties (user bookmarks)
CREATE TABLE IF NOT EXISTS saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  property_sanity_id text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_properties_user_property ON saved_properties(user_id, property_sanity_id);

-- Referrals
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  referee_email text,
  code text UNIQUE,
  reward_amount numeric(30,8) DEFAULT 0,
  reward_issued boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

-- Two-factor auth data (if you manage 2FA outside Supabase Auth)
CREATE TABLE IF NOT EXISTS two_factor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  secret text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text,
  title text,
  body text,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

-- Admin users table (optional) - could be derived from `profiles` with role
-- Sessions, password reset tokens, etc. can be handled by Supabase Auth

-- Materialized view example: user_balance (basic aggregation from transactions)
-- This is optional and illustrative; adapt to your business rules.

CREATE MATERIALIZED VIEW IF NOT EXISTS user_balance AS
SELECT
  p.id AS user_id,
  COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'completed' THEN t.amount ELSE 0 END),0) -
  COALESCE(SUM(CASE WHEN t.type = 'withdrawal' AND t.status = 'completed' THEN t.amount ELSE 0 END),0) AS balance
FROM profiles p
LEFT JOIN transactions t ON t.user_id = p.id
GROUP BY p.id;

-- Grants: recommended to manage via Supabase Policies in the dashboard

-- Optional seed data (uncomment and edit values to insert):
-- INSERT INTO roles (name, description) VALUES ('user', 'Regular user'), ('admin', 'Administrator');
-- INSERT INTO cryptos (sanity_id, symbol, name, price, description, change_24h, expected_roi, risk_level, min_investment, market_cap, logo_url)
-- VALUES ('sanityCrypto1','MATIC','Polygon',0.89,'Layer-2 scaling','6.1',210,'high',15,8700000000,'https://...');

-- Helpful helper functions or triggers can be added later for updated_at timestamps

-- Trigger to update `updated_at` on change for tables where relevant
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tables with updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_profiles') THEN
    CREATE TRIGGER set_timestamp_profiles BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_cryptos') THEN
    CREATE TRIGGER set_timestamp_cryptos BEFORE UPDATE ON cryptos FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_properties') THEN
    CREATE TRIGGER set_timestamp_properties BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_transactions') THEN
    CREATE TRIGGER set_timestamp_transactions BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_investments') THEN
    CREATE TRIGGER set_timestamp_investments BEFORE UPDATE ON investments FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- End of schema
