-- Script to confirm a user's email address in Supabase
-- Run this in your Supabase SQL Editor
-- Replace 'user@example.com' with the actual email address

-- Option 1: Confirm email for a specific user by email
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'user@example.com'
  AND email_confirmed_at IS NULL;

-- Option 2: Confirm email for a specific user by ID (if you know the user ID)
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE id = 'user-uuid-here'
--   AND email_confirmed_at IS NULL;

-- Option 3: Confirm ALL unconfirmed emails (use with caution!)
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- Verify the update
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'user@example.com';

