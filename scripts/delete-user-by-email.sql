-- Script to delete a user by email address
-- Run this in your Supabase SQL Editor
-- Replace 'user@example.com' with the actual email address
-- WARNING: This will delete the user and all related data (cascade)

-- First, find the user ID
SELECT id, email, created_at
FROM auth.users
WHERE email = 'user@example.com';

-- Then delete the user (this will cascade delete related records due to ON DELETE CASCADE)
DELETE FROM auth.users
WHERE email = 'user@example.com';

-- Verify deletion
SELECT id, email
FROM auth.users
WHERE email = 'user@example.com';
-- Should return 0 rows

