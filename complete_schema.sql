-- ===========================================
-- COMPREHENSIVE SUPABASE SCHEMA FOR REAL ESTATE APP
-- ===========================================
-- This is the COMPLETE schema containing ALL tables, columns, RLS policies,
-- indexes, triggers, and seed data needed for full site functionality.
--
-- Run this in Supabase SQL Editor to set up the complete database.
-- ===========================================

-- Ensure UUID generation function is available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- ENUM TYPES
-- ===========================================
DO $$ BEGIN
    CREATE TYPE txn_status AS ENUM ('pending','completed','failed','cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE txn_type AS ENUM ('deposit','withdrawal','investment','payout','fee','refund');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE investment_status AS ENUM ('pending','active','completed','cancelled','failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low','medium','high','unknown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE investment_type_enum AS ENUM ('crypto', 'property', 'plan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE growth_direction_enum AS ENUM ('up', 'down', 'stable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE investment_growth_mode_enum AS ENUM ('automatic', 'manual', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ===========================================
-- ROLES TABLE (for RBAC)
-- ===========================================
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- USERS TABLE (linked to Supabase Auth)
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'agent', 'investor', 'user')),
  permissions text[] DEFAULT '{}',
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Banned')),
  last_login timestamptz,
  phone_number text,
  wallet_address text,
  is_admin boolean DEFAULT false, -- Legacy field for compatibility
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- PROFILES TABLE (alternative user profile system)
-- ===========================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE,
  full_name text,
  avatar_url text,
  phone text,
  role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
  wallet_address text,
  referral_code text UNIQUE,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- USER ROLES TABLE (RBAC user-role assignments)
-- ===========================================
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- ===========================================
-- CRYPTOS TABLE (crypto investment options)
-- ===========================================
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

-- ===========================================
-- CRYPTO WALLETS TABLE (dynamic crypto management)
-- ===========================================
CREATE TABLE IF NOT EXISTS crypto_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol varchar(10) NOT NULL UNIQUE,
  name varchar(50) NOT NULL,
  wallet_address text NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- PROPERTIES TABLE (property listings)
-- ===========================================
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

-- ===========================================
-- TRANSACTIONS TABLE (all financial transactions)
-- ===========================================
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type txn_type NOT NULL,
  amount numeric(30,8) NOT NULL,
  currency varchar(16) DEFAULT 'USD',
  status txn_status DEFAULT 'pending',
  provider varchar(128), -- e.g., 'stripe','paystack','coinbase','crypto'
  provider_txn_id text,
  related_object jsonb, -- e.g., {"crypto_id": "...", "property_sanity_id": "..."}
  fees numeric(30,8) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- INVESTMENT PLANS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS investment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  roi_rate decimal(5,2) NOT NULL,
  min_investment decimal(15,2) NOT NULL,
  max_investment decimal(15,2),
  duration_months integer,
  risk_level text,
  type text DEFAULT 'plan',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add risk_level column if it doesn't exist (for existing tables)
DO $$ BEGIN
    ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS risk_level text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add type column if it doesn't exist (for existing tables)
DO $$ BEGIN
    ALTER TABLE investment_plans ADD COLUMN IF NOT EXISTS type text DEFAULT 'plan';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- ===========================================
-- INVESTMENTS TABLE (user investments)
-- ===========================================
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount_invested decimal(15,2) NOT NULL,
  investment_type investment_type_enum NOT NULL,
  roi_rate decimal(5,2) NOT NULL,
  roi_amount decimal(15,2) DEFAULT 0,
  sanity_id text, -- For property investments
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  duration_months integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- PAYMENTS TABLE (payment tracking)
-- ===========================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  investment_id uuid REFERENCES investments(id) ON DELETE CASCADE,
  amount decimal(15,2) NOT NULL,
  payment_method text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  tx_hash text,
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- ONCHAIN TRANSFERS TABLE (blockchain tracking)
-- ===========================================
CREATE TABLE IF NOT EXISTS onchain_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions(id) ON DELETE CASCADE,
  chain varchar(64),
  tx_hash text,
  from_address text,
  to_address text,
  confirmations integer DEFAULT 0,
  status txn_status DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- WALLETS TABLE (user saved wallets)
-- ===========================================
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text,
  address text NOT NULL,
  chain varchar(64),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- SAVED PROPERTIES TABLE (user bookmarks)
-- ===========================================
CREATE TABLE IF NOT EXISTS saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_sanity_id text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- REFERRALS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  referee_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  referral_code_snapshot text, -- The code used when signing up
  commission_amount numeric(30,8) DEFAULT 0,
  commission_paid boolean DEFAULT false,
  status text DEFAULT 'pending',
  first_investment_amount numeric(30,8),
  first_investment_date timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ===========================================
-- ROI SETTINGS TABLE (dynamic ROI management)
-- ===========================================
CREATE TABLE IF NOT EXISTS roi_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_type investment_type_enum NOT NULL,
  base_roi decimal(5,2),
  adjustment_rate decimal(5,2),
  growth_direction growth_direction_enum DEFAULT 'stable',
  last_updated timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- ===========================================
-- ROI HISTORY TABLE (ROI change tracking)
-- ===========================================
CREATE TABLE IF NOT EXISTS roi_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_type text,
  previous_roi decimal(5,2),
  new_roi decimal(5,2),
  adjustment_rate decimal(5,2),
  growth_direction growth_direction_enum,
  changed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- ADMIN CONTROLS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS admin_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_growth_mode investment_growth_mode_enum DEFAULT 'automatic',
  roi_adjustment_rate decimal(5,2) DEFAULT 0,
  last_applied timestamptz
);

-- ===========================================
-- AUDIT LOGS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip inet,
  user_agent text,
  performed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- WEBHOOK EVENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text,
  event_type text,
  status text,
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  provider_txn_id text,
  target_status text,
  error_message text,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- TWO FACTOR AUTH TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS two_factor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- NOTIFICATIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text,
  title text,
  body text,
  data jsonb DEFAULT '{}'::jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_cryptos_symbol ON cryptos(symbol);
CREATE INDEX IF NOT EXISTS idx_cryptos_marketcap ON cryptos(market_cap DESC);

CREATE INDEX IF NOT EXISTS idx_crypto_wallets_symbol ON crypto_wallets(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_enabled ON crypto_wallets(enabled);

CREATE INDEX IF NOT EXISTS idx_properties_sanity_id ON properties(sanity_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

CREATE INDEX IF NOT EXISTS idx_investment_plans_status ON investment_plans(status);

CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(investment_type);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_investment ON payments(investment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_onchain_tx_hash ON onchain_transfers(tx_hash);

CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_properties_user_property ON saved_properties(user_id, property_sanity_id);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_roi_settings_type ON roi_settings(investment_type);
CREATE INDEX IF NOT EXISTS idx_roi_history_type ON roi_history(investment_type);

-- ===========================================
-- ENABLE ROW LEVEL SECURITY
-- ===========================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cryptos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE onchain_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- ADMIN HELPER FUNCTION
-- ===========================================
-- Drop existing function and all its dependencies
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS check_admin_status(uuid) CASCADE;
DROP FUNCTION IF EXISTS check_admin_status() CASCADE;

-- Create the new function with a unique name
CREATE FUNCTION check_admin_status(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id
    AND r.name = 'admin'
  );
END;
$$;

-- ===========================================
-- RLS POLICIES (SAFE FOR MULTIPLE RUNS)
-- ===========================================

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_admin_all" ON users;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_admin_all" ON users FOR ALL USING (check_admin_status());

-- PROFILES TABLE POLICIES
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (check_admin_status());

-- ROLES TABLE POLICIES
DROP POLICY IF EXISTS "roles_admin_all" ON roles;
CREATE POLICY "roles_admin_all" ON roles FOR ALL USING (check_admin_status());

-- USER ROLES TABLE POLICIES
DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON user_roles;
CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_all" ON user_roles FOR ALL USING (check_admin_status());

-- CRYPTOS TABLE POLICIES
DROP POLICY IF EXISTS "cryptos_select_public" ON cryptos;
DROP POLICY IF EXISTS "cryptos_admin_all" ON cryptos;
CREATE POLICY "cryptos_select_public" ON cryptos FOR SELECT USING (true);
CREATE POLICY "cryptos_admin_all" ON cryptos FOR ALL USING (check_admin_status());

-- CRYPTO WALLETS TABLE POLICIES
DROP POLICY IF EXISTS "crypto_wallets_select_enabled" ON crypto_wallets;
DROP POLICY IF EXISTS "crypto_wallets_admin_all" ON crypto_wallets;
CREATE POLICY "crypto_wallets_select_enabled" ON crypto_wallets FOR SELECT USING (enabled = true);
CREATE POLICY "crypto_wallets_admin_all" ON crypto_wallets FOR ALL USING (check_admin_status());

-- PROPERTIES TABLE POLICIES
DROP POLICY IF EXISTS "properties_select_public" ON properties;
DROP POLICY IF EXISTS "properties_admin_all" ON properties;
CREATE POLICY "properties_select_public" ON properties FOR SELECT USING (true);
CREATE POLICY "properties_admin_all" ON properties FOR ALL USING (check_admin_status());

-- TRANSACTIONS TABLE POLICIES
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON transactions;
DROP POLICY IF EXISTS "transactions_admin_all" ON transactions;
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "transactions_update_own" ON transactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "transactions_delete_own" ON transactions FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "transactions_admin_all" ON transactions FOR ALL USING (check_admin_status());

-- INVESTMENT PLANS TABLE POLICIES
DROP POLICY IF EXISTS "investment_plans_select_active" ON investment_plans;
DROP POLICY IF EXISTS "investment_plans_admin_all" ON investment_plans;
CREATE POLICY "investment_plans_select_active" ON investment_plans FOR SELECT USING (status = 'active');
CREATE POLICY "investment_plans_admin_all" ON investment_plans FOR ALL USING (check_admin_status());

-- INVESTMENTS TABLE POLICIES
DROP POLICY IF EXISTS "investments_select_own" ON investments;
DROP POLICY IF EXISTS "investments_insert_own" ON investments;
DROP POLICY IF EXISTS "investments_update_own" ON investments;
DROP POLICY IF EXISTS "investments_delete_own" ON investments;
DROP POLICY IF EXISTS "investments_admin_all" ON investments;
CREATE POLICY "investments_select_own" ON investments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "investments_insert_own" ON investments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "investments_update_own" ON investments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "investments_delete_own" ON investments FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "investments_admin_all" ON investments FOR ALL USING (check_admin_status());

-- PAYMENTS TABLE POLICIES
DROP POLICY IF EXISTS "payments_select_own" ON payments;
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (check_admin_status());

-- ONCHAIN TRANSFERS TABLE POLICIES
DROP POLICY IF EXISTS "onchain_select_related" ON onchain_transfers;
DROP POLICY IF EXISTS "onchain_admin_all" ON onchain_transfers;
CREATE POLICY "onchain_select_related" ON onchain_transfers FOR SELECT
  USING (EXISTS (SELECT 1 FROM transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));
CREATE POLICY "onchain_admin_all" ON onchain_transfers FOR ALL USING (check_admin_status());

-- WALLETS TABLE POLICIES
DROP POLICY IF EXISTS "wallets_select_own" ON wallets;
DROP POLICY IF EXISTS "wallets_insert_own" ON wallets;
DROP POLICY IF EXISTS "wallets_update_own" ON wallets;
DROP POLICY IF EXISTS "wallets_delete_own" ON wallets;
DROP POLICY IF EXISTS "wallets_admin_all" ON wallets;
CREATE POLICY "wallets_select_own" ON wallets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wallets_insert_own" ON wallets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "wallets_update_own" ON wallets FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "wallets_delete_own" ON wallets FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "wallets_admin_all" ON wallets FOR ALL USING (check_admin_status());

-- SAVED PROPERTIES TABLE POLICIES
DROP POLICY IF EXISTS "saved_props_select_own" ON saved_properties;
DROP POLICY IF EXISTS "saved_props_insert_own" ON saved_properties;
DROP POLICY IF EXISTS "saved_props_update_own" ON saved_properties;
DROP POLICY IF EXISTS "saved_props_delete_own" ON saved_properties;
DROP POLICY IF EXISTS "saved_props_admin_all" ON saved_properties;
CREATE POLICY "saved_props_select_own" ON saved_properties FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "saved_props_insert_own" ON saved_properties FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_props_update_own" ON saved_properties FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "saved_props_delete_own" ON saved_properties FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "saved_props_admin_all" ON saved_properties FOR ALL USING (check_admin_status());

-- REFERRALS TABLE POLICIES
DROP POLICY IF EXISTS "referrals_select_own" ON referrals;
DROP POLICY IF EXISTS "referrals_insert_own" ON referrals;
DROP POLICY IF EXISTS "referrals_admin_all" ON referrals;
CREATE POLICY "referrals_select_own" ON referrals FOR SELECT USING (referrer_id = auth.uid());
CREATE POLICY "referrals_insert_own" ON referrals FOR INSERT WITH CHECK (referrer_id = auth.uid());
CREATE POLICY "referrals_admin_all" ON referrals FOR ALL USING (check_admin_status());

-- ROI SETTINGS TABLE POLICIES
DROP POLICY IF EXISTS "roi_settings_admin_all" ON roi_settings;
CREATE POLICY "roi_settings_admin_all" ON roi_settings FOR ALL USING (check_admin_status());

-- ROI HISTORY TABLE POLICIES
DROP POLICY IF EXISTS "roi_history_admin_all" ON roi_history;
CREATE POLICY "roi_history_admin_all" ON roi_history FOR ALL USING (check_admin_status());

-- ADMIN CONTROLS TABLE POLICIES
DROP POLICY IF EXISTS "admin_controls_admin_all" ON admin_controls;
CREATE POLICY "admin_controls_admin_all" ON admin_controls FOR ALL USING (check_admin_status());

-- AUDIT LOGS TABLE POLICIES
DROP POLICY IF EXISTS "audit_logs_select_own" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON audit_logs;
CREATE POLICY "audit_logs_select_own" ON audit_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "audit_logs_admin_select" ON audit_logs FOR SELECT USING (check_admin_status());
CREATE POLICY "audit_logs_insert_system" ON audit_logs FOR INSERT WITH CHECK (true);

-- WEBHOOK EVENTS TABLE POLICIES
DROP POLICY IF EXISTS "webhook_events_admin_all" ON webhook_events;
CREATE POLICY "webhook_events_admin_all" ON webhook_events FOR ALL USING (check_admin_status());

-- TWO FACTOR TABLE POLICIES
DROP POLICY IF EXISTS "twofactor_select_own" ON two_factor;
DROP POLICY IF EXISTS "twofactor_insert_own" ON two_factor;
DROP POLICY IF EXISTS "twofactor_update_own" ON two_factor;
DROP POLICY IF EXISTS "twofactor_delete_own" ON two_factor;
CREATE POLICY "twofactor_select_own" ON two_factor FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "twofactor_insert_own" ON two_factor FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "twofactor_update_own" ON two_factor FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "twofactor_delete_own" ON two_factor FOR DELETE USING (user_id = auth.uid());

-- NOTIFICATIONS TABLE POLICIES
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_insert_server" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_server" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE USING (user_id = auth.uid());

-- ===========================================
-- TRIGGERS FOR UPDATED_AT
-- ===========================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'profiles', 'roles', 'cryptos', 'crypto_wallets', 'properties', 'transactions', 'investment_plans', 'investments', 'payments', 'onchain_transfers', 'wallets', 'saved_properties', 'referrals', 'roi_settings', 'roi_history', 'admin_controls', 'audit_logs', 'webhook_events', 'two_factor', 'notifications')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp_%I ON %I', table_name, table_name);
        EXECUTE format('CREATE TRIGGER set_timestamp_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp()', table_name, table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- MATERIALIZED VIEWS
-- ===========================================
CREATE MATERIALIZED VIEW IF NOT EXISTS user_balance AS
SELECT
  u.id AS user_id,
  COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN t.type = 'withdrawal' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) AS balance
FROM users u
LEFT JOIN transactions t ON t.user_id = u.id
GROUP BY u.id;

-- ===========================================
-- SEED DATA
-- ===========================================

-- Insert default roles
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full system access', ARRAY[
    'manage_users', 'manage_properties', 'manage_investments',
    'manage_transactions', 'view_reports', 'manage_crypto',
    'manage_agents', 'view_analytics'
  ]),
  ('agent', 'Property and investment management', ARRAY[
    'manage_properties', 'manage_investments', 'view_reports'
  ]),
  ('investor', 'Investment access', ARRAY[
    'manage_investments', 'view_reports'
  ]),
  ('user', 'Basic user access', ARRAY[]::TEXT[])
ON CONFLICT (name) DO NOTHING;

-- Insert default admin controls
INSERT INTO admin_controls (investment_growth_mode, roi_adjustment_rate) VALUES
  ('automatic', 0)
ON CONFLICT DO NOTHING;

-- Insert sample investment plans
INSERT INTO investment_plans (name, description, roi_rate, min_investment, max_investment, duration_months, risk_level, type) VALUES
  ('Conservative Plan', 'Low risk investment with steady returns', 5.00, 100.00, 10000.00, 12, 'low', 'plan'),
  ('Balanced Plan', 'Medium risk with moderate returns', 8.50, 500.00, 50000.00, 24, 'medium', 'plan'),
  ('Aggressive Plan', 'High risk with high potential returns', 15.00, 1000.00, 100000.00, 36, 'high', 'plan')
ON CONFLICT DO NOTHING;

-- Insert sample ROI settings
INSERT INTO roi_settings (investment_type, base_roi, adjustment_rate, growth_direction) VALUES
  ('crypto', 12.00, 0.00, 'stable'),
  ('property', 8.00, 0.00, 'stable'),
  ('plan', 10.00, 0.00, 'stable')
ON CONFLICT DO NOTHING;

-- ===========================================
-- USER PROFILE CREATION TRIGGER
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name, role, permissions, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'user',
    '{}',
    'Active'
  );

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );

  -- Assign role based on users.role
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, r.id FROM roles r WHERE r.name = (
    SELECT role FROM users WHERE id = NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- AUDIT LOGGING FUNCTIONS
-- ===========================================
CREATE OR REPLACE FUNCTION log_user_action(
  action_name text,
  action_details jsonb DEFAULT '{}'::jsonb,
  target_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, details, performed_by)
  VALUES (target_user_id, action_name, action_details, auth.uid());
END;
$$;

-- ===========================================
-- END OF SCHEMA
-- ===========================================
-- This schema includes ALL tables, columns, policies, and seed data
-- needed for the complete real estate investment platform.
--
-- To apply: Copy and paste this entire file into Supabase SQL Editor and run it.