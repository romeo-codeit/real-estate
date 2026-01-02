-- Create a regular user account (ucezema2025@gmail.com - Felix User)
-- Run this in Supabase SQL Editor to create the user account

DO $$
DECLARE
  v_user_id UUID;
  v_user_role_id UUID;
BEGIN
  -- Get user role ID
  SELECT id INTO v_user_role_id FROM roles WHERE name = 'user';
  
  -- Get or create auth user
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'ucezema2025@gmail.com';
  
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
      'ucezema2025@gmail.com',
      crypt('User1234$', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Felix","last_name":"User"}'::jsonb,
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
  VALUES (v_user_id, 'ucezema2025@gmail.com', 'Felix User', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET 
    email = 'ucezema2025@gmail.com',
    full_name = 'Felix User',
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
    'ucezema2025@gmail.com',
    'Felix',
    'User',
    'user',
    ARRAY[]::text[],
    'Active',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'user',
    permissions = ARRAY[]::text[],
    status = 'Active',
    updated_at = NOW();
  RAISE NOTICE 'Users table upserted';

  -- Assign user role
  DELETE FROM user_roles WHERE user_id = v_user_id;
  INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
  VALUES (v_user_id, v_user_role_id, NOW(), NOW());
  RAISE NOTICE 'User role assigned';

  RAISE NOTICE '✅ User account created with ID: %', v_user_id;
  RAISE NOTICE 'Email: ucezema2025@gmail.com';
  RAISE NOTICE 'Password: User1234$';
  
END $$;
