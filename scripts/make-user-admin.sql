-- Script to make an existing user an admin
-- Run this in your Supabase SQL Editor
-- Replace 'reyeskaze10@gmail.com' with the actual email if different

DO $$
DECLARE
  v_user_id UUID;
  v_admin_role_id UUID;
  v_admin_permissions TEXT[] := ARRAY[
    'manage_users',
    'manage_properties',
    'manage_investments',
    'manage_transactions',
    'view_reports',
    'manage_crypto',
    'manage_agents',
    'view_analytics'
  ];
BEGIN
  -- Find the user by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'reyeskaze10@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: reyeskaze10@gmail.com';
  END IF;
  
  RAISE NOTICE 'Found user ID: %', v_user_id;
  
  -- Get or create admin role
  SELECT id INTO v_admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
  
  IF v_admin_role_id IS NULL THEN
    INSERT INTO roles (name, description, permissions)
    VALUES ('admin', 'Administrator', v_admin_permissions)
    RETURNING id INTO v_admin_role_id;
    RAISE NOTICE 'Created admin role';
  ELSE
    RAISE NOTICE 'Found admin role ID: %', v_admin_role_id;
  END IF;
  
  -- Temporarily disable the role protection trigger (if it exists)
  BEGIN
    ALTER TABLE users DISABLE TRIGGER prevent_role_permission_changes_trigger;
  EXCEPTION WHEN OTHERS THEN
    -- Trigger doesn't exist or already disabled, continue
    RAISE NOTICE 'Could not disable trigger (may not exist): %', SQLERRM;
  END;
  
  -- Update users table with admin role and permissions
  UPDATE users
  SET 
    role = 'admin',
    permissions = v_admin_permissions,
    status = 'Active',
    updated_at = NOW()
  WHERE id = v_user_id;
  
  RAISE NOTICE 'Updated users table with admin role';
  
  -- Ensure profile exists
  INSERT INTO profiles (id, email, full_name, created_at, updated_at)
  VALUES (v_user_id, 'reyeskaze10@gmail.com', 'Kaze Reyes', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = 'reyeskaze10@gmail.com',
    full_name = 'Kaze Reyes',
    updated_at = NOW();
  
  RAISE NOTICE 'Profile ensured';
  
  -- Remove any existing role assignments and assign admin role
  DELETE FROM user_roles WHERE user_id = v_user_id;
  INSERT INTO user_roles (user_id, role_id, created_at, updated_at)
  VALUES (v_user_id, v_admin_role_id, NOW(), NOW());
  
  RAISE NOTICE 'Assigned admin role in user_roles table';
  
  -- Re-enable the role protection trigger (if it was disabled)
  BEGIN
    ALTER TABLE users ENABLE TRIGGER prevent_role_permission_changes_trigger;
  EXCEPTION WHEN OTHERS THEN
    -- Trigger doesn't exist, continue
    NULL;
  END;
  
  RAISE NOTICE '✅ User successfully made an admin!';
  RAISE NOTICE 'Email: reyeskaze10@gmail.com';
  RAISE NOTICE 'User ID: %', v_user_id;
  
END $$;

-- Verify the update
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.role,
  u.permissions,
  u.status,
  r.name as role_name
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'reyeskaze10@gmail.com';

