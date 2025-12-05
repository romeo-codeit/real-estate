-- Supabase RLS Policies - Clean & Working
-- Run this in Supabase SQL Editor AFTER `supabase_schema.sql`
-- This uses proper Postgres RLS syntax

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor ENABLE ROW LEVEL SECURITY;
ALTER TABLE onchain_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cryptos ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Admin helper function
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1 FROM profiles p
    JOIN roles r ON p.role_id = r.id
    WHERE p.id = auth.uid() AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE;


-- ===============================
-- PROFILES TABLE POLICIES
-- ===============================
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE
  USING (auth.uid() = id);

CREATE POLICY "profiles_admin_all" ON profiles FOR ALL
  USING (is_admin());

-- ===============================
-- TRANSACTIONS TABLE POLICIES
-- ===============================
CREATE POLICY "transactions_select_own" ON transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update_own" ON transactions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "transactions_delete_own" ON transactions FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "transactions_admin_all" ON transactions FOR ALL
  USING (is_admin());

-- ===============================
-- INVESTMENTS TABLE POLICIES
-- ===============================
CREATE POLICY "investments_select_own" ON investments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "investments_insert_own" ON investments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "investments_update_own" ON investments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "investments_delete_own" ON investments FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "investments_admin_all" ON investments FOR ALL
  USING (is_admin());

-- ===============================
-- WALLETS TABLE POLICIES
-- ===============================
CREATE POLICY "wallets_select_own" ON wallets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "wallets_insert_own" ON wallets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "wallets_update_own" ON wallets FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "wallets_delete_own" ON wallets FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "wallets_admin_all" ON wallets FOR ALL
  USING (is_admin());

-- ===============================
-- SAVED PROPERTIES TABLE POLICIES
-- ===============================
CREATE POLICY "saved_props_select_own" ON saved_properties FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "saved_props_insert_own" ON saved_properties FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_props_update_own" ON saved_properties FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "saved_props_delete_own" ON saved_properties FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "saved_props_admin_all" ON saved_properties FOR ALL
  USING (is_admin());

-- ===============================
-- NOTIFICATIONS TABLE POLICIES
-- ===============================
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_server" ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  USING (user_id = auth.uid());

-- ===============================
-- TWO_FACTOR TABLE POLICIES
-- ===============================
CREATE POLICY "twofactor_select_own" ON two_factor FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "twofactor_insert_own" ON two_factor FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "twofactor_update_own" ON two_factor FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "twofactor_delete_own" ON two_factor FOR DELETE
  USING (user_id = auth.uid());

-- ===============================
-- ONCHAIN_TRANSFERS TABLE POLICIES
-- ===============================
CREATE POLICY "onchain_select_related" ON onchain_transfers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM transactions t
    WHERE t.id = transaction_id AND t.user_id = auth.uid()
  ));

CREATE POLICY "onchain_admin_all" ON onchain_transfers FOR ALL
  USING (is_admin());

-- ===============================
-- AUDIT_LOGS TABLE POLICIES
-- ===============================
CREATE POLICY "audit_logs_admin_select" ON audit_logs FOR SELECT
  USING (is_admin());

-- ===============================
-- CRYPTOS TABLE POLICIES (PUBLIC READ)
-- ===============================
CREATE POLICY "cryptos_select_public" ON cryptos FOR SELECT
  USING (true);

CREATE POLICY "cryptos_admin_insert" ON cryptos FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "cryptos_admin_update" ON cryptos FOR UPDATE
  USING (is_admin());

CREATE POLICY "cryptos_admin_delete" ON cryptos FOR DELETE
  USING (is_admin());

-- ===============================
-- PROPERTIES TABLE POLICIES (PUBLIC READ)
-- ===============================
CREATE POLICY "properties_select_public" ON properties FOR SELECT
  USING (true);

CREATE POLICY "properties_admin_insert" ON properties FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "properties_admin_update" ON properties FOR UPDATE
  USING (is_admin());

CREATE POLICY "properties_admin_delete" ON properties FOR DELETE
  USING (is_admin());

-- End of policies
