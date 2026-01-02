-- Run this in Supabase SQL Editor to create/fix admin account
-- Handles existing partial records and bypasses protection triggers

DO $$
DECLARE
  v_user_id UUID;
  v_admin_role_id UUID;
BEGIN
  -- Temporarily disable the role protection trigger
  ALTER TABLE users DISABLE TRIGGER prevent_role_permission_changes_trigger;
  
  -- Get admin role ID
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin';
  
  -- Get or create auth user
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'reyeskaze10@gmail.com';
  
  IF v_user_id IS NULL THEN
    -- Create new auth user
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      aud,
      role
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'reyeskaze10@gmail.com',
      crypt('Admin1234$', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Kaze","last_name":"Reyes"}'::jsonb,
      NOW(),
      NOW(),
      '',
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO v_user_id;
    RAISE NOTICE 'Created auth user';
  ELSE
    RAISE NOTICE 'Auth user already exists with ID: %', v_user_id;
  END IF;

  -- Create or update profile
  INSERT INTO profiles (id, email, full_name, created_at, updated_at)
  VALUES (v_user_id, 'reyeskaze10@gmail.com', 'Kaze Reyes', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET 
    email = 'reyeskaze10@gmail.com',
    full_name = 'Kaze Reyes',
    updated_at = NOW();
  RAISE NOTICE 'Profile upserted';

  -- Create or update user record
  INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    permissions, 
    status,
    created_at, 
    updated_at
  ) VALUES (
    v_user_id,
    'reyeskaze10@gmail.com',
    'Kaze',
    'Reyes',
    'admin',
    ARRAY['manage_users','manage_properties','manage_investments','manage_transactions','view_reports','manage_crypto','manage_agents','view_analytics'],
    'Active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    permissions = ARRAY['manage_users','manage_properties','manage_investments','manage_transactions','view_reports','manage_crypto','manage_agents','view_analytics'],
    status = 'Active',
    updated_at = NOW();
  RAISE NOTICE 'Users table upserted';

  -- Assign admin role (remove old roles first)
  DELETE FROM user_roles WHERE user_id = v_user_id;
  INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
  VALUES (v_user_id, v_admin_role_id, NOW(), NOW());
  RAISE NOTICE 'Admin role assigned';

  RAISE NOTICE '✅ Admin user ready with ID: %', v_user_id;
  RAISE NOTICE 'Email: reyeskaze10@gmail.com';
  RAISE NOTICE 'Password: Admin1234$';
  
  -- Re-enable the role protection trigger
  ALTER TABLE users ENABLE TRIGGER prevent_role_permission_changes_trigger;
END $$;
