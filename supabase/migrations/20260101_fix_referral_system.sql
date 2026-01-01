-- Add referral_code to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Fix referrals table
-- Rename existing columns if they exist to match service
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

-- Add missing columns to referrals
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS referee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS first_investment_amount numeric(30,8),
ADD COLUMN IF NOT EXISTS first_investment_date timestamptz,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure referee_id is unique (one referrer per user)
ALTER TABLE referrals 
DROP CONSTRAINT IF EXISTS referrals_referee_id_key;

ALTER TABLE referrals 
ADD CONSTRAINT referrals_referee_id_key UNIQUE (referee_id);

-- Drop referee_email if it exists (using referee_id instead)
ALTER TABLE referrals 
DROP COLUMN IF EXISTS referee_email;

-- Update RLS policies for profiles to allow reading referral codes (public read might be needed if checking valid code on signup?)
-- Actually, createReferral uses service role usually or assumes authenticated user.
-- But validateReferralCode might be called public.
-- Let's ensure profiles are readable.
-- Existing policy: "profiles_admin_all" and "profiles_select_own".
-- We might need a function to lookup referrer ID by code without exposing all profiles.

CREATE OR REPLACE FUNCTION get_referrer_id_by_code(code text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE referral_code = code;
$$;
