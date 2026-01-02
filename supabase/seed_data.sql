-- ===========================================
-- SEED DATA FOR REAL ESTATE APP
-- ===========================================
-- Run this AFTER unified_schema.sql to populate initial data.
-- This file contains all default roles, plans, and settings.
-- ===========================================

-- ===========================================
-- DEFAULT ROLES
-- ===========================================
INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Full system access', ARRAY[
    'manage_users', 'manage_properties', 'manage_investments',
    'manage_transactions', 'view_reports', 'manage_crypto',
    'manage_agents', 'view_analytics'
  ]),
  ('agent', 'Property and investment management', ARRAY[
    'manage_properties', 'manage_investments', 'view_reports'
  ]),
  ('user', 'Basic user access', ARRAY[]::TEXT[])
ON CONFLICT (name) DO NOTHING;

-- ===========================================
-- DEFAULT ADMIN CONTROLS
-- ===========================================
INSERT INTO admin_controls (investment_growth_mode, roi_adjustment_rate) VALUES
  ('automatic', 0.1)
ON CONFLICT DO NOTHING;

-- ===========================================
-- DEFAULT INVESTMENT PLANS
-- ===========================================
INSERT INTO investment_plans (name, description, roi_rate, min_investment, max_investment, duration_months, risk_level, type, status) VALUES
  ('Starter Plan', 'Perfect for new investors looking to start small', 6.50, 1000.00, 9999.00, 12, 'low', 'plan', 'active'),
  ('Conservative Plan', 'Low risk investment with steady returns', 5.00, 100.00, 10000.00, 12, 'low', 'plan', 'active'),
  ('Growth Plan', 'Balanced investment with moderate returns', 8.75, 10000.00, 49999.00, 24, 'medium', 'plan', 'active'),
  ('Balanced Plan', 'Medium risk with moderate returns', 8.50, 500.00, 50000.00, 24, 'medium', 'plan', 'active'),
  ('Premium Plan', 'High-yield investment for experienced investors', 12.00, 50000.00, 250000.00, 36, 'high', 'plan', 'active'),
  ('Aggressive Plan', 'High risk with high potential returns', 15.00, 1000.00, 100000.00, 36, 'high', 'plan', 'active'),
  ('Elite Plan', 'Maximum returns for sophisticated investors', 15.50, 250000.00, NULL, NULL, 'high', 'plan', 'active')
ON CONFLICT DO NOTHING;

-- ===========================================
-- DEFAULT ROI SETTINGS
-- ===========================================
INSERT INTO roi_settings (investment_type, base_roi, adjustment_rate, growth_direction) VALUES
  ('crypto', 12.00, 0.5, 'up'),
  ('property', 8.50, 0.2, 'stable'),
  ('plan', 10.00, 0.3, 'up')
ON CONFLICT DO NOTHING;

-- ===========================================
-- ADMIN USER SETUP (Optional - uncomment and modify as needed)
-- ===========================================
-- To add an admin user, first create them through Supabase Auth,
-- then run this query with their email:
--
-- INSERT INTO public.users (id, email, first_name, last_name, role, permissions, status)
-- VALUES (
--   (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1),
--   'admin@example.com',
--   'Admin',
--   'User',
--   'admin',
--   ARRAY['manage_users', 'manage_properties', 'manage_investments', 'manage_transactions', 'view_reports', 'manage_crypto', 'manage_agents', 'view_analytics'],
--   'Active'
-- ) ON CONFLICT (id) DO UPDATE SET role = 'admin', permissions = EXCLUDED.permissions;

-- ===========================================
-- END OF SEED DATA
-- ===========================================
