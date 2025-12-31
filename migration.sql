-- Drop the table if it exists with wrong schema (using CASCADE to drop dependent policies)
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.investment_plans CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.roi_settings CASCADE;
DROP TABLE IF EXISTS public.roi_history CASCADE;
DROP TABLE IF EXISTS public.admin_controls CASCADE;
DROP TABLE IF EXISTS public.referrals CASCADE;

-- Drop existing enum types if they exist
DROP TYPE IF EXISTS investment_type_enum CASCADE;
DROP TYPE IF EXISTS growth_direction_enum CASCADE;
DROP TYPE IF EXISTS investment_growth_mode_enum CASCADE;

-- Create custom enum types
CREATE TYPE investment_type_enum AS ENUM ('crypto', 'property', 'plan');
CREATE TYPE growth_direction_enum AS ENUM ('up', 'down', 'stable');
CREATE TYPE investment_growth_mode_enum AS ENUM ('automatic', 'manual', 'paused');

-- Create the users table with proper schema
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'agent', 'investor', 'user')),
  permissions TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Banned')),
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'investment', 'payout', 'fee', 'refund')),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  provider TEXT, -- payment provider (stripe, paypal, etc.)
  provider_txn_id TEXT, -- external transaction ID
  related_object JSONB, -- related investment, property, etc.
  fees DECIMAL(10,2) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_favorites table to allow users to save properties
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Only allow users to read their own favorites
CREATE POLICY "Users can view their own favorites" ON public.user_favorites
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to insert their own favorites
CREATE POLICY "Users can add their own favorites" ON public.user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own favorites
CREATE POLICY "Users can delete their own favorites" ON public.user_favorites
  FOR DELETE USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_property_favorite ON public.user_favorites(user_id, property_id);


-- Create investment_plans table
CREATE TABLE IF NOT EXISTS public.investment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  roi_rate DECIMAL(5,2) NOT NULL, -- e.g., 8.50 for 8.5%
  min_investment DECIMAL(15,2) NOT NULL,
  max_investment DECIMAL(15,2), -- NULL means no maximum
  duration_months INTEGER, -- NULL means flexible duration
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create investments table
CREATE TABLE IF NOT EXISTS public.investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  amount_invested DECIMAL(15,2) NOT NULL,
  investment_type investment_type_enum NOT NULL,
  roi_rate DECIMAL(5,2) NOT NULL,
  roi_amount DECIMAL(15,2) DEFAULT 0,
  sanity_id TEXT, -- For property investments (Sanity CMS ID)
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ, -- Calculated based on duration
  duration_months INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES public.investments(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'stripe', 'paypal', 'paystack', 'crypto'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  tx_hash TEXT, -- For crypto transactions
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ROI settings table for dynamic ROI management
CREATE TABLE IF NOT EXISTS public.roi_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_type investment_type_enum NOT NULL,
  base_roi DECIMAL(5,2) NOT NULL,
  adjustment_rate DECIMAL(5,2) DEFAULT 0,
  growth_direction growth_direction_enum DEFAULT 'stable',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

-- Create ROI history table for tracking changes
CREATE TABLE IF NOT EXISTS public.roi_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_type investment_type_enum NOT NULL,
  previous_roi DECIMAL(5,2),
  new_roi DECIMAL(5,2),
  adjustment_rate DECIMAL(5,2),
  growth_direction growth_direction_enum,
  changed_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin controls table
CREATE TABLE IF NOT EXISTS public.admin_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_growth_mode investment_growth_mode_enum DEFAULT 'automatic',
  roi_adjustment_rate DECIMAL(5,2) DEFAULT 0,
  last_applied TIMESTAMPTZ
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on new tables
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_controls ENABLE ROW LEVEL SECURITY;

-- Create policies for transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all transactions" ON public.transactions
  FOR ALL USING (is_admin(auth.uid()));

-- Create trigger for transactions updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for new tables
DROP TRIGGER IF EXISTS update_investment_plans_updated_at ON public.investment_plans;
CREATE TRIGGER update_investment_plans_updated_at BEFORE UPDATE ON public.investment_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_investments_updated_at ON public.investments;
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roi_settings_last_updated ON public.roi_settings;
CREATE TRIGGER update_roi_settings_last_updated BEFORE UPDATE ON public.roi_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_type ON public.investments(investment_type);
CREATE INDEX IF NOT EXISTS idx_investments_status ON public.investments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_investment_id ON public.payments(investment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_investment_plans_status ON public.investment_plans(status);
CREATE INDEX IF NOT EXISTS idx_roi_settings_type ON public.roi_settings(investment_type);
CREATE INDEX IF NOT EXISTS idx_roi_history_type ON public.roi_history(investment_type);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;

-- Create policies
-- Allow users to read their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (except role and permissions)
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create a security definer function to check admin status without recursion
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
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

-- Allow admins to do everything
CREATE POLICY "Admins can manage all users" ON public.users
  FOR ALL USING (is_admin(auth.uid()));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to prevent non-admins from changing role and permissions
CREATE OR REPLACE FUNCTION prevent_role_permission_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if the user is admin (but since admin policy allows all, this trigger might not fire for admins)
  -- Actually, for non-admins, check if role or permissions changed
  IF OLD.role != NEW.role OR OLD.permissions != NEW.permissions THEN
    -- Check if the current user is admin
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
      RAISE EXCEPTION 'Only admins can change role and permissions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS prevent_role_permission_changes_trigger ON public.users;
CREATE TRIGGER prevent_role_permission_changes_trigger BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION prevent_role_permission_changes();

-- Recreate dependent policies
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- e.g., 'login', 'user_update', 'investment_create', etc.
  resource_type TEXT, -- e.g., 'user', 'investment', 'transaction', etc.
  resource_id UUID, -- ID of the affected resource
  details JSONB, -- Additional details about the action
  ip_address INET, -- IP address of the user
  user_agent TEXT, -- Browser/device info
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on roles and audit_logs
DROP POLICY IF EXISTS "Admins can view roles" ON public.roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.roles;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- Policies for roles table
CREATE POLICY "Admins can view roles" ON public.roles
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles" ON public.roles
  FOR ALL USING (is_admin(auth.uid()));

-- Policies for audit_logs table
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Policies for investment_plans table
DROP POLICY IF EXISTS "Anyone can view active investment plans" ON public.investment_plans;
DROP POLICY IF EXISTS "Admins can manage investment plans" ON public.investment_plans;

CREATE POLICY "Anyone can view active investment plans" ON public.investment_plans
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage investment plans" ON public.investment_plans
  FOR ALL USING (is_admin(auth.uid()));

-- Policies for investments table
DROP POLICY IF EXISTS "Users can view their own investments" ON public.investments;
DROP POLICY IF EXISTS "Users can create their own investments" ON public.investments;
DROP POLICY IF EXISTS "Admins can view all investments" ON public.investments;
DROP POLICY IF EXISTS "Admins can manage all investments" ON public.investments;

CREATE POLICY "Users can view their own investments" ON public.investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own investments" ON public.investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all investments" ON public.investments
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all investments" ON public.investments
  FOR ALL USING (is_admin(auth.uid()));

-- Policies for payments table
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;

CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL USING (is_admin(auth.uid()));

-- Policies for ROI settings table
DROP POLICY IF EXISTS "Admins can manage ROI settings" ON public.roi_settings;

CREATE POLICY "Admins can manage ROI settings" ON public.roi_settings
  FOR ALL USING (is_admin(auth.uid()));

-- Policies for ROI history table
DROP POLICY IF EXISTS "Admins can view ROI history" ON public.roi_history;
DROP POLICY IF EXISTS "System can insert ROI history" ON public.roi_history;

CREATE POLICY "Admins can view ROI history" ON public.roi_history
  FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert ROI history" ON public.roi_history
  FOR INSERT WITH CHECK (true);

-- Policies for admin controls table
DROP POLICY IF EXISTS "Admins can manage admin controls" ON public.admin_controls;

CREATE POLICY "Admins can manage admin controls" ON public.admin_controls
  FOR ALL USING (is_admin(auth.uid()));

-- Insert the admin user (replace with actual admin email)
-- Note: This assumes the admin user is already created in auth.users
INSERT INTO public.users (id, email, first_name, last_name, role, permissions, status)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'timothydivine9@gmail.com' LIMIT 1),
  'timothydivine9@gmail.com',
  'Timothy',
  'Divine',
  'admin',
  ARRAY['manage_users', 'manage_properties', 'manage_investments', 'manage_transactions', 'view_reports', 'manage_crypto', 'manage_agents', 'view_analytics'],
  'Active'
) ON CONFLICT (id) DO NOTHING;

-- Insert default investment plans
INSERT INTO public.investment_plans (name, description, roi_rate, min_investment, max_investment, duration_months, status) VALUES
  ('Starter Plan', 'Perfect for new investors looking to start small', 6.50, 1000.00, 9999.00, 12, 'active'),
  ('Growth Plan', 'Balanced investment with moderate returns', 8.75, 10000.00, 49999.00, 24, 'active'),
  ('Premium Plan', 'High-yield investment for experienced investors', 12.00, 50000.00, 250000.00, 36, 'active'),
  ('Elite Plan', 'Maximum returns for sophisticated investors', 15.50, 250000.00, NULL, NULL, 'active')
ON CONFLICT DO NOTHING;

-- Insert default ROI settings
INSERT INTO public.roi_settings (investment_type, base_roi, adjustment_rate, growth_direction) VALUES
  ('crypto', 12.00, 0.5, 'up'),
  ('property', 8.50, 0.2, 'stable'),
  ('plan', 10.00, 0.3, 'up')
ON CONFLICT DO NOTHING;

-- Insert default admin controls
INSERT INTO public.admin_controls (investment_growth_mode, roi_adjustment_rate) VALUES
  ('automatic', 0.1)
ON CONFLICT DO NOTHING;

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'invested', 'completed')),
  commission_amount DECIMAL(15,2) DEFAULT 0,
  commission_paid BOOLEAN DEFAULT false,
  first_investment_amount DECIMAL(15,2),
  first_investment_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- Enable RLS on referrals table
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for referrals table
DROP POLICY IF EXISTS "Users can view their own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can view referrals where they are the referee" ON public.referrals;
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Users can view referrals where they are the referee" ON public.referrals
  FOR SELECT USING (auth.uid() = referee_id);

CREATE POLICY "System can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update referrals" ON public.referrals
  FOR UPDATE USING (true);

-- Create reports table for user-submitted reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('property', 'comment', 'user_profile', 'investment', 'crypto')),
  content_id TEXT NOT NULL, -- ID of the reported content
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate_content', 'scam', 'copyright_violation', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  admin_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moderation_queue table for flagged content
CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('property', 'comment', 'user_profile', 'investment', 'crypto')),
  content_id TEXT NOT NULL,
  flagged_by UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- System or user who flagged
  flag_reason TEXT NOT NULL CHECK (flag_reason IN ('automated', 'user_report', 'admin_review')),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected', 'removed')),
  review_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create moderation_actions table for tracking actions taken
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderation_id UUID REFERENCES public.moderation_queue(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('approve', 'reject', 'remove', 'warn', 'suspend', 'ban', 'content_edit')),
  action_details JSONB, -- Additional details about the action
  performed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on reports table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for reports table
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;

-- RLS policies for reports
CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Enable RLS on moderation_queue table
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for moderation_queue table
DROP POLICY IF EXISTS "Admins can view moderation queue" ON public.moderation_queue;
DROP POLICY IF EXISTS "Admins can update moderation queue" ON public.moderation_queue;
DROP POLICY IF EXISTS "System can insert into moderation queue" ON public.moderation_queue;

-- RLS policies for moderation_queue
CREATE POLICY "Admins can view moderation queue" ON public.moderation_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can update moderation queue" ON public.moderation_queue
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "System can insert into moderation queue" ON public.moderation_queue
  FOR INSERT WITH CHECK (true);

-- Enable RLS on moderation_actions table
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for moderation_actions table
DROP POLICY IF EXISTS "Admins can view moderation actions" ON public.moderation_actions;
DROP POLICY IF EXISTS "Admins can create moderation actions" ON public.moderation_actions;

-- RLS policies for moderation_actions
CREATE POLICY "Admins can view moderation actions" ON public.moderation_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

CREATE POLICY "Admins can create moderation actions" ON public.moderation_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_content_type ON public.reports(content_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON public.moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_content_type ON public.moderation_queue(content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_created_at ON public.moderation_queue(created_at);

-- Create triggers for updated_at timestamps
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_moderation_queue_updated_at ON public.moderation_queue;
CREATE TRIGGER update_moderation_queue_updated_at BEFORE UPDATE ON public.moderation_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_referrals_updated_at ON public.referrals;
CREATE TRIGGER update_referrals_updated_at BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();