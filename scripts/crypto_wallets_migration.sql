-- Create crypto_wallets table for dynamic cryptocurrency management
CREATE TABLE IF NOT EXISTS crypto_wallets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    wallet_address TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE crypto_wallets ENABLE ROW LEVEL SECURITY;

-- Allow admins to manage crypto wallets
CREATE POLICY "Allow admins to manage crypto wallets" ON crypto_wallets
    FOR ALL USING (is_admin());

-- Allow all users to read enabled crypto wallets
CREATE POLICY "Allow users to read enabled crypto wallets" ON crypto_wallets
    FOR SELECT USING (enabled = true);

-- Note: No default crypto wallets inserted - add them through the admin interface with correct addresses