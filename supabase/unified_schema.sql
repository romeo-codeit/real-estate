-- ===========================================
-- UNIFIED DATABASE SCHEMA FOR REAL ESTATE APP
-- ===========================================
-- This is the COMPLETE consolidated schema containing ALL tables, columns, 
-- RLS policies, indexes, triggers, and functions needed for full functionality.
--
-- Run this in Supabase SQL Editor to set up the complete database.
-- Generated: 2026-01-01
-- ===========================================

-- Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- ENUM TYPES
-- ===========================================
DO $$ BEGIN
    CREATE TYPE txn_status AS ENUM ('pending','completed','failed','cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE txn_type AS ENUM ('deposit','withdrawal','investment','payout','fee','refund');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE investment_status AS ENUM ('pending','active','completed','cancelled','failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low','medium','high','unknown');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE investment_type_enum AS ENUM ('crypto', 'property', 'plan');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE growth_direction_enum AS ENUM ('up', 'down', 'stable');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE investment_growth_mode_enum AS ENUM ('automatic', 'manual', 'paused');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE kyc_status_enum AS ENUM ('none', 'pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ===========================================
-- CORE TABLES
-- ===========================================

-- ROLES TABLE (for RBAC)
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- USERS TABLE (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'agent', 'user')),
  permissions text[] DEFAULT '{}',
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Banned')),
  last_login timestamptz,
  phone_number text,
  wallet_address text,
  is_admin boolean DEFAULT false,
  -- KYC fields
  kyc_status text DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected')),
  kyc_verified_at timestamptz,
  kyc_documents jsonb DEFAULT '{}'::jsonb,
  kyc_rejection_reason text,
  -- Withdrawal limits
  daily_withdrawal_limit numeric(30,2) DEFAULT 1000, -- Default $1000/day without KYC
  total_withdrawn_today numeric(30,2) DEFAULT 0,
  last_withdrawal_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PROFILES TABLE (alternative user profile system)
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

-- Add missing columns to profiles if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='referral_code') THEN
    ALTER TABLE profiles ADD COLUMN referral_code text UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='phone') THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role_id') THEN
    ALTER TABLE profiles ADD COLUMN role_id uuid REFERENCES roles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='wallet_address') THEN
    ALTER TABLE profiles ADD COLUMN wallet_address text;
  END IF;
END $$;

-- USER ROLES TABLE (RBAC user-role assignments)
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- ===========================================
-- FINANCIAL TABLES
-- ===========================================

-- TRANSACTIONS TABLE (all financial transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type txn_type NOT NULL,
  amount numeric(30,8) NOT NULL,
  currency varchar(16) DEFAULT 'USD',
  status txn_status DEFAULT 'pending',
  provider varchar(128),
  provider_txn_id text,
  related_object jsonb,
  fees numeric(30,8) DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- INVESTMENT PLANS TABLE
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

-- INVESTMENTS TABLE (user investments)
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount_invested decimal(15,2) NOT NULL,
  investment_type investment_type_enum NOT NULL,
  roi_rate decimal(5,2) NOT NULL,
  roi_amount decimal(15,2) DEFAULT 0,
  sanity_id text,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  duration_months integer,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PAYMENTS TABLE (payment tracking)
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
-- CRYPTO & PROPERTY TABLES
-- ===========================================

-- CRYPTOS TABLE (crypto investment options)
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

-- CRYPTO WALLETS TABLE (dynamic crypto management)
CREATE TABLE IF NOT EXISTS crypto_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol varchar(10) NOT NULL UNIQUE,
  name varchar(50) NOT NULL,
  wallet_address text NOT NULL,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- PROPERTIES TABLE (property listings)
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
-- BLOCKCHAIN & WALLET TABLES
-- ===========================================

-- ONCHAIN TRANSFERS TABLE (blockchain tracking)
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

-- WALLETS TABLE (user saved wallets)
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text,
  address text NOT NULL,
  chain varchar(64),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- SAVED PROPERTIES TABLE (user bookmarks)
CREATE TABLE IF NOT EXISTS saved_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_sanity_id text NOT NULL,
  note text,
  created_at timestamptz DEFAULT now()
);

-- USER FAVORITES TABLE (alternative bookmarks)
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  property_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- REFERRAL SYSTEM
-- ===========================================

CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES users(id) ON DELETE SET NULL,
  referee_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  referral_code_snapshot text,
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
-- ROI & ADMIN CONTROL TABLES
-- ===========================================

-- ROI SETTINGS TABLE (dynamic ROI management)
CREATE TABLE IF NOT EXISTS roi_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_type investment_type_enum NOT NULL,
  base_roi decimal(5,2),
  adjustment_rate decimal(5,2),
  growth_direction growth_direction_enum DEFAULT 'stable',
  last_updated timestamptz DEFAULT now(),
  updated_by uuid REFERENCES users(id)
);

-- ROI HISTORY TABLE (ROI change tracking)
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

-- ADMIN CONTROLS TABLE
CREATE TABLE IF NOT EXISTS admin_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_growth_mode investment_growth_mode_enum DEFAULT 'automatic',
  roi_adjustment_rate decimal(5,2) DEFAULT 0,
  last_applied timestamptz
);

-- ===========================================
-- AUDIT & LOGGING TABLES
-- ===========================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  ip inet,
  user_agent text,
  performed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  event_type text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  transaction_id uuid REFERENCES transactions(id) ON DELETE SET NULL,
  provider_txn_id text,
  target_status text,
  error_message text,
  retry_count integer DEFAULT 0,
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  UNIQUE(provider, event_id)
);

-- ===========================================
-- USER FEATURE TABLES
-- ===========================================

CREATE TABLE IF NOT EXISTS two_factor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  secret text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

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
-- MODERATION TABLES
-- ===========================================

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('property', 'comment', 'user_profile', 'investment', 'crypto')),
  content_id text NOT NULL,
  reason text NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate_content', 'scam', 'copyright_violation', 'other')),
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('property', 'comment', 'user_profile', 'investment', 'crypto')),
  content_id text NOT NULL,
  flagged_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_reason text NOT NULL CHECK (flag_reason IN ('automated', 'user_report', 'admin_review')),
  severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'removed')),
  review_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderation_id uuid REFERENCES moderation_queue(id) ON DELETE CASCADE,
  report_id uuid REFERENCES reports(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('approve', 'reject', 'remove', 'warn', 'suspend', 'ban', 'content_edit')),
  action_details jsonb,
  performed_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

CREATE INDEX IF NOT EXISTS idx_cryptos_symbol ON cryptos(symbol);
CREATE INDEX IF NOT EXISTS idx_cryptos_marketcap ON cryptos(market_cap DESC);

CREATE INDEX IF NOT EXISTS idx_crypto_wallets_symbol ON crypto_wallets(symbol);
CREATE INDEX IF NOT EXISTS idx_crypto_wallets_enabled ON crypto_wallets(enabled);

CREATE INDEX IF NOT EXISTS idx_properties_sanity_id ON properties(sanity_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

CREATE INDEX IF NOT EXISTS idx_investment_plans_status ON investment_plans(status);

CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(investment_type);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_investment ON payments(investment_id);
CREATE INDEX IF NOT EXISTS idx_payments_investment_id ON payments(investment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_onchain_tx_hash ON onchain_transfers(tx_hash);

CREATE UNIQUE INDEX IF NOT EXISTS uq_saved_properties_user_property ON saved_properties(user_id, property_sanity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_property_favorite ON user_favorites(user_id, property_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_roi_settings_type ON roi_settings(investment_type);
CREATE INDEX IF NOT EXISTS idx_roi_history_type ON roi_history(investment_type);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_content_type ON reports(content_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_content_type ON moderation_queue(content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at ON moderation_queue(created_at);

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
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Drop existing admin check functions
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS check_admin_status(uuid) CASCADE;
DROP FUNCTION IF EXISTS check_admin_status() CASCADE;

-- Admin check function (using user_roles)
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

-- Alternative admin check (using users table role)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Referrer lookup function
CREATE OR REPLACE FUNCTION get_referrer_id_by_code(code text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE referral_code = code;
$$;

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Prevent non-admins from changing role and permissions
CREATE OR REPLACE FUNCTION prevent_role_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role != NEW.role OR OLD.permissions != NEW.permissions THEN
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
      RAISE EXCEPTION 'Only admins can change role and permissions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Log user action function
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
-- RLS POLICIES
-- ===========================================

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_admin_all" ON users FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

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
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- ROLES TABLE POLICIES
DROP POLICY IF EXISTS "roles_admin_all" ON roles;
DROP POLICY IF EXISTS "Admins can view roles" ON roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON roles;
CREATE POLICY "roles_admin_all" ON roles FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- USER ROLES TABLE POLICIES
DROP POLICY IF EXISTS "user_roles_select_own" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_all" ON user_roles;
CREATE POLICY "user_roles_select_own" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_all" ON user_roles FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- CRYPTOS TABLE POLICIES
DROP POLICY IF EXISTS "cryptos_select_public" ON cryptos;
DROP POLICY IF EXISTS "cryptos_admin_all" ON cryptos;
DROP POLICY IF EXISTS "cryptos_admin_insert" ON cryptos;
DROP POLICY IF EXISTS "cryptos_admin_update" ON cryptos;
DROP POLICY IF EXISTS "cryptos_admin_delete" ON cryptos;
CREATE POLICY "cryptos_select_public" ON cryptos FOR SELECT USING (true);
CREATE POLICY "cryptos_admin_all" ON cryptos FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- CRYPTO WALLETS TABLE POLICIES
DROP POLICY IF EXISTS "crypto_wallets_select_enabled" ON crypto_wallets;
DROP POLICY IF EXISTS "crypto_wallets_admin_all" ON crypto_wallets;
DROP POLICY IF EXISTS "Allow admins to manage crypto wallets" ON crypto_wallets;
DROP POLICY IF EXISTS "Allow users to read enabled crypto wallets" ON crypto_wallets;
CREATE POLICY "crypto_wallets_select_enabled" ON crypto_wallets FOR SELECT USING (enabled = true);
CREATE POLICY "crypto_wallets_admin_all" ON crypto_wallets FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- PROPERTIES TABLE POLICIES
DROP POLICY IF EXISTS "properties_select_public" ON properties;
DROP POLICY IF EXISTS "properties_admin_all" ON properties;
DROP POLICY IF EXISTS "properties_admin_insert" ON properties;
DROP POLICY IF EXISTS "properties_admin_update" ON properties;
DROP POLICY IF EXISTS "properties_admin_delete" ON properties;
CREATE POLICY "properties_select_public" ON properties FOR SELECT USING (true);
CREATE POLICY "properties_admin_all" ON properties FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- TRANSACTIONS TABLE POLICIES
DROP POLICY IF EXISTS "transactions_select_own" ON transactions;
DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
DROP POLICY IF EXISTS "transactions_update_own" ON transactions;
DROP POLICY IF EXISTS "transactions_delete_own" ON transactions;
DROP POLICY IF EXISTS "transactions_admin_all" ON transactions;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON transactions;
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "transactions_update_own" ON transactions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "transactions_delete_own" ON transactions FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "transactions_admin_all" ON transactions FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- INVESTMENT PLANS TABLE POLICIES
DROP POLICY IF EXISTS "investment_plans_select_active" ON investment_plans;
DROP POLICY IF EXISTS "investment_plans_admin_all" ON investment_plans;
DROP POLICY IF EXISTS "Anyone can view active investment plans" ON investment_plans;
DROP POLICY IF EXISTS "Admins can manage investment plans" ON investment_plans;
CREATE POLICY "investment_plans_select_active" ON investment_plans FOR SELECT USING (status = 'active');
CREATE POLICY "investment_plans_admin_all" ON investment_plans FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- INVESTMENTS TABLE POLICIES
DROP POLICY IF EXISTS "investments_select_own" ON investments;
DROP POLICY IF EXISTS "investments_insert_own" ON investments;
DROP POLICY IF EXISTS "investments_update_own" ON investments;
DROP POLICY IF EXISTS "investments_delete_own" ON investments;
DROP POLICY IF EXISTS "investments_admin_all" ON investments;
DROP POLICY IF EXISTS "Users can view their own investments" ON investments;
DROP POLICY IF EXISTS "Users can create their own investments" ON investments;
DROP POLICY IF EXISTS "Admins can view all investments" ON investments;
DROP POLICY IF EXISTS "Admins can manage all investments" ON investments;
CREATE POLICY "investments_select_own" ON investments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "investments_insert_own" ON investments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "investments_update_own" ON investments FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "investments_delete_own" ON investments FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "investments_admin_all" ON investments FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- PAYMENTS TABLE POLICIES
DROP POLICY IF EXISTS "payments_select_own" ON payments;
DROP POLICY IF EXISTS "payments_admin_all" ON payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;
CREATE POLICY "payments_select_own" ON payments FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "payments_admin_all" ON payments FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- ONCHAIN TRANSFERS TABLE POLICIES
DROP POLICY IF EXISTS "onchain_select_related" ON onchain_transfers;
DROP POLICY IF EXISTS "onchain_admin_all" ON onchain_transfers;
CREATE POLICY "onchain_select_related" ON onchain_transfers FOR SELECT
  USING (EXISTS (SELECT 1 FROM transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));
CREATE POLICY "onchain_admin_all" ON onchain_transfers FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

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
CREATE POLICY "wallets_admin_all" ON wallets FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

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
CREATE POLICY "saved_props_admin_all" ON saved_properties FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- USER FAVORITES TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can add their own favorites" ON user_favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON user_favorites;
CREATE POLICY "Users can view their own favorites" ON user_favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can add their own favorites" ON user_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON user_favorites FOR DELETE USING (auth.uid() = user_id);

-- REFERRALS TABLE POLICIES
DROP POLICY IF EXISTS "referrals_select_own" ON referrals;
DROP POLICY IF EXISTS "referrals_insert_own" ON referrals;
DROP POLICY IF EXISTS "referrals_admin_all" ON referrals;
DROP POLICY IF EXISTS "Users can view their own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referee" ON referrals;
DROP POLICY IF EXISTS "System can insert referrals" ON referrals;
DROP POLICY IF EXISTS "System can update referrals" ON referrals;
CREATE POLICY "referrals_select_own" ON referrals FOR SELECT USING (referrer_id = auth.uid() OR referee_id = auth.uid());
CREATE POLICY "referrals_insert_own" ON referrals FOR INSERT WITH CHECK (true);
CREATE POLICY "referrals_update_system" ON referrals FOR UPDATE USING (true);
CREATE POLICY "referrals_admin_all" ON referrals FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- ROI SETTINGS TABLE POLICIES
DROP POLICY IF EXISTS "roi_settings_admin_all" ON roi_settings;
DROP POLICY IF EXISTS "Admins can manage ROI settings" ON roi_settings;
CREATE POLICY "roi_settings_admin_all" ON roi_settings FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- ROI HISTORY TABLE POLICIES
DROP POLICY IF EXISTS "roi_history_admin_all" ON roi_history;
DROP POLICY IF EXISTS "Admins can view ROI history" ON roi_history;
DROP POLICY IF EXISTS "System can insert ROI history" ON roi_history;
CREATE POLICY "roi_history_admin_all" ON roi_history FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));
CREATE POLICY "roi_history_insert_system" ON roi_history FOR INSERT WITH CHECK (true);

-- ADMIN CONTROLS TABLE POLICIES
DROP POLICY IF EXISTS "admin_controls_admin_all" ON admin_controls;
DROP POLICY IF EXISTS "Admins can manage admin controls" ON admin_controls;
CREATE POLICY "admin_controls_admin_all" ON admin_controls FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

-- AUDIT LOGS TABLE POLICIES
DROP POLICY IF EXISTS "audit_logs_select_own" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_admin_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_system" ON audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
CREATE POLICY "audit_logs_select_own" ON audit_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "audit_logs_admin_select" ON audit_logs FOR SELECT USING (check_admin_status() OR is_admin(auth.uid()));
CREATE POLICY "audit_logs_insert_system" ON audit_logs FOR INSERT WITH CHECK (true);

-- WEBHOOK EVENTS TABLE POLICIES
DROP POLICY IF EXISTS "webhook_events_admin_all" ON webhook_events;
CREATE POLICY "webhook_events_admin_all" ON webhook_events FOR ALL USING (check_admin_status() OR is_admin(auth.uid()));

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

-- REPORTS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "reports_select_own" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "reports_admin_select" ON reports FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "reports_insert_own" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_admin_update" ON reports FOR UPDATE USING (is_admin(auth.uid()));

-- MODERATION QUEUE TABLE POLICIES
DROP POLICY IF EXISTS "Admins can view moderation queue" ON moderation_queue;
DROP POLICY IF EXISTS "Admins can update moderation queue" ON moderation_queue;
DROP POLICY IF EXISTS "System can insert into moderation queue" ON moderation_queue;
CREATE POLICY "moderation_queue_admin_select" ON moderation_queue FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "moderation_queue_admin_update" ON moderation_queue FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "moderation_queue_insert_system" ON moderation_queue FOR INSERT WITH CHECK (true);

-- MODERATION ACTIONS TABLE POLICIES
DROP POLICY IF EXISTS "Admins can view moderation actions" ON moderation_actions;
DROP POLICY IF EXISTS "Admins can create moderation actions" ON moderation_actions;
CREATE POLICY "moderation_actions_admin_select" ON moderation_actions FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "moderation_actions_admin_insert" ON moderation_actions FOR INSERT WITH CHECK (is_admin(auth.uid()));

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Apply timestamp triggers to all tables with updated_at
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'profiles', 'roles', 'cryptos', 'crypto_wallets', 'properties', 
                          'transactions', 'investment_plans', 'investments', 'payments', 
                          'onchain_transfers', 'wallets', 'saved_properties', 'referrals', 
                          'roi_settings', 'roi_history', 'admin_controls', 'audit_logs', 
                          'webhook_events', 'two_factor', 'notifications', 'reports', 'moderation_queue')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS set_timestamp_%I ON %I', tbl, tbl);
        EXECUTE format('CREATE TRIGGER set_timestamp_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp()', tbl, tbl);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Role permission change protection trigger
DROP TRIGGER IF EXISTS prevent_role_permission_changes_trigger ON users;
CREATE TRIGGER prevent_role_permission_changes_trigger BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_role_permission_changes();

-- ===========================================
-- USER PROFILE CREATION TRIGGER
-- ===========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role_id UUID;
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

  -- Get user role ID first, then assign
  SELECT id INTO v_user_role_id FROM roles WHERE name = 'user' LIMIT 1;
  
  IF v_user_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id, created_at, updated_at)
    VALUES (NEW.id, v_user_role_id, NOW(), NOW());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- ATOMIC FINANCIAL FUNCTIONS
-- ===========================================

-- Reserve funds and create investment atomically
CREATE OR REPLACE FUNCTION reserve_funds_for_investment(
  p_user_id UUID,
  p_amount NUMERIC,
  p_investment_type TEXT,
  p_sanity_id TEXT DEFAULT NULL,
  p_roi_rate NUMERIC DEFAULT 0,
  p_duration_months NUMERIC DEFAULT 0,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
  v_pending_withdrawals NUMERIC;
  v_pending_investments NUMERIC;
  v_available NUMERIC;
  v_investment_id UUID;
  v_result JSONB;
BEGIN
  -- Acquire advisory lock for this user to serialize operations
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Calculate confirmed balance
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('deposit', 'payout', 'refund') THEN amount
      WHEN type IN ('withdrawal', 'investment', 'fee') THEN -amount
      ELSE 0
    END
  ), 0)
  INTO v_balance
  FROM transactions
  WHERE user_id = p_user_id AND status = 'completed';

  -- Calculate pending withdrawals
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_withdrawals
  FROM transactions
  WHERE user_id = p_user_id AND type = 'withdrawal' AND status = 'pending';

  -- Calculate pending investments
  SELECT COALESCE(SUM(amount_invested), 0)
  INTO v_pending_investments
  FROM investments
  WHERE user_id = p_user_id AND status = 'pending';

  -- Calculate final available balance
  v_available := v_balance - v_pending_withdrawals - v_pending_investments;

  -- Check if sufficient funds
  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds. Available: %, Required: %', v_available, p_amount;
  END IF;

  -- Create the investment
  INSERT INTO investments (
    user_id, sanity_id, amount_invested, investment_type, 
    roi_rate, duration_months, status, start_date, end_date
  )
  VALUES (
    p_user_id, p_sanity_id, p_amount, p_investment_type::investment_type_enum, 
    p_roi_rate, p_duration_months, 'pending', p_start_date, p_end_date
  )
  RETURNING id INTO v_investment_id;

  -- Return the result
  SELECT jsonb_build_object(
    'id', v_investment_id,
    'status', 'pending',
    'amount_invested', p_amount,
    'available_before', v_available,
    'available_after', v_available - p_amount
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Get user balance details atomically
CREATE OR REPLACE FUNCTION get_user_balance_details(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
  v_pending_withdrawals NUMERIC;
  v_pending_investments NUMERIC;
  v_available NUMERIC;
  v_result JSONB;
BEGIN
  -- Calculate confirmed balance
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('deposit', 'payout', 'refund') THEN amount
      WHEN type IN ('withdrawal', 'investment', 'fee') THEN -amount
      ELSE 0
    END
  ), 0)
  INTO v_balance
  FROM transactions
  WHERE user_id = p_user_id AND status = 'completed';

  -- Calculate pending withdrawals
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_withdrawals
  FROM transactions
  WHERE user_id = p_user_id AND type = 'withdrawal' AND status = 'pending';

  -- Calculate pending investments
  SELECT COALESCE(SUM(amount_invested), 0)
  INTO v_pending_investments
  FROM investments
  WHERE user_id = p_user_id AND status = 'pending';

  -- Calculate available balance
  v_available := v_balance - v_pending_withdrawals - v_pending_investments;

  IF v_available < 0 THEN
    v_available := 0;
  END IF;

  SELECT jsonb_build_object(
    'balance', v_balance,
    'pendingWithdrawals', v_pending_withdrawals,
    'pendingInvestments', v_pending_investments,
    'availableToWithdraw', v_available
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Request withdrawal atomically
CREATE OR REPLACE FUNCTION request_withdrawal(
  p_user_id UUID,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'USD',
  p_provider TEXT DEFAULT 'crypto',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
  v_pending_withdrawals NUMERIC;
  v_pending_investments NUMERIC;
  v_available NUMERIC;
  v_transaction_id UUID;
  v_result JSONB;
BEGIN
  -- Acquire advisory lock for this user
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  -- Block if any pending withdrawal exists
  IF EXISTS (SELECT 1 FROM transactions WHERE user_id = p_user_id AND type = 'withdrawal' AND status = 'pending') THEN
    RAISE EXCEPTION 'Existing pending withdrawal found. Please wait for approval.';
  END IF;

  -- Calculate confirmed balance
  SELECT COALESCE(SUM(
    CASE 
      WHEN type IN ('deposit', 'payout', 'refund') THEN amount
      WHEN type IN ('withdrawal', 'investment', 'fee') THEN -amount
      ELSE 0
    END
  ), 0)
  INTO v_balance
  FROM transactions
  WHERE user_id = p_user_id AND status = 'completed';

  -- Calculate pending withdrawals
  SELECT COALESCE(SUM(amount), 0)
  INTO v_pending_withdrawals
  FROM transactions
  WHERE user_id = p_user_id AND type = 'withdrawal' AND status = 'pending';

  -- Calculate pending investments
  SELECT COALESCE(SUM(amount_invested), 0)
  INTO v_pending_investments
  FROM investments
  WHERE user_id = p_user_id AND status = 'pending';

  -- Calculate available balance
  v_available := v_balance - v_pending_withdrawals - v_pending_investments;

  -- Check sufficient funds
  IF v_available < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds. Available: %, Required: %', v_available, p_amount;
  END IF;

  -- Create withdrawal transaction
  INSERT INTO transactions (user_id, type, amount, currency, status, provider, metadata)
  VALUES (p_user_id, 'withdrawal', p_amount, p_currency, 'pending', p_provider, p_metadata)
  RETURNING id INTO v_transaction_id;

  -- Return Result
  SELECT jsonb_build_object(
    'id', v_transaction_id,
    'status', 'pending',
    'amount', p_amount,
    'available_after', v_available - p_amount
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ===========================================
-- MATERIALIZED VIEWS
-- ===========================================
DROP MATERIALIZED VIEW IF EXISTS user_balance;
CREATE MATERIALIZED VIEW user_balance AS
SELECT
  u.id AS user_id,
  COALESCE(SUM(CASE WHEN t.type = 'deposit' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN t.type = 'withdrawal' AND t.status = 'completed' THEN t.amount ELSE 0 END), 0) AS balance
FROM users u
LEFT JOIN transactions t ON t.user_id = u.id
GROUP BY u.id;

-- ===========================================
-- MIGRATION: 20250101_reserve_funds.sql
-- ===========================================
-- (Already included above in ATOMIC FINANCIAL FUNCTIONS section)

-- ===========================================
-- MIGRATION: 20260101_fix_referral_system.sql
-- ===========================================
-- Add referral_code to profiles (idempotent check)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='referral_code') THEN
    ALTER TABLE profiles ADD COLUMN referral_code text UNIQUE;
  END IF;
END $$;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Fix referrals table - Rename existing columns if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'code') THEN
        ALTER TABLE referrals RENAME COLUMN code TO referral_code_snapshot;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'reward_amount') THEN
        ALTER TABLE referrals RENAME COLUMN reward_amount TO commission_amount;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'referrals' AND column_name = 'reward_issued') THEN
        ALTER TABLE referrals RENAME COLUMN reward_issued TO commission_paid;
    END IF;
END $$;

-- Add missing columns to referrals (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='referee_id') THEN
    ALTER TABLE referrals ADD COLUMN referee_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='status') THEN
    ALTER TABLE referrals ADD COLUMN status text DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='first_investment_amount') THEN
    ALTER TABLE referrals ADD COLUMN first_investment_amount numeric(30,8);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='first_investment_date') THEN
    ALTER TABLE referrals ADD COLUMN first_investment_date timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='updated_at') THEN
    ALTER TABLE referrals ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Ensure referee_id is unique (one referrer per user) - idempotent
DO $$ BEGIN
  BEGIN
    ALTER TABLE referrals ADD CONSTRAINT referrals_referee_id_key UNIQUE (referee_id);
  EXCEPTION WHEN duplicate_table THEN
    NULL;
  END;
END $$;

-- Drop referee_email if it exists (using referee_id instead)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referrals' AND column_name='referee_email') THEN
    ALTER TABLE referrals DROP COLUMN referee_email;
  END IF;
END $$;

-- ===========================================
-- END OF SCHEMA
-- ===========================================
