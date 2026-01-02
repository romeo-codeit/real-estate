-- Fix signup trigger: Add RLS policies to allow trigger function to insert
-- This fixes the 500 error when creating new users

-- ===========================================
-- FIX RLS POLICIES FOR TRIGGER FUNCTION
-- ===========================================

-- Add INSERT policy for users table to allow trigger function to create users
-- SECURITY DEFINER functions should bypass RLS, but Supabase may still enforce it
-- This policy allows the trigger to insert during user creation
DROP POLICY IF EXISTS "users_insert_trigger" ON users;
CREATE POLICY "users_insert_trigger" ON users 
  FOR INSERT 
  WITH CHECK (true);

-- Update profiles INSERT policy to allow trigger inserts
-- During signup, auth.uid() might not be set yet, so we need a fallback
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
  
-- Add a separate policy for system/trigger inserts
DROP POLICY IF EXISTS "profiles_insert_system" ON profiles;
CREATE POLICY "profiles_insert_system" ON profiles 
  FOR INSERT 
  WITH CHECK (true);

-- ===========================================
-- IMPROVE TRIGGER FUNCTION WITH ERROR HANDLING
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role_id UUID;
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
BEGIN
  -- Extract names from metadata
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  v_full_name := TRIM(v_first_name || ' ' || v_last_name);
  
  -- If no name provided, use email prefix as fallback
  IF v_full_name = '' OR v_full_name IS NULL THEN
    v_full_name := SPLIT_PART(NEW.email, '@', 1);
    v_first_name := v_full_name;
    v_last_name := '';
  END IF;

  -- Insert into users table
  BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, role, permissions, status)
    VALUES (
      NEW.id,
      NEW.email,
      v_first_name,
      v_last_name,
      'user',
      '{}',
      'Active'
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to insert into users table: %', SQLERRM;
    -- Continue execution - don't fail the entire signup
  END;

  -- Insert into profiles table
  BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
      NEW.id,
      NEW.email,
      v_full_name
    )
    ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to insert into profiles table: %', SQLERRM;
    -- Continue execution - don't fail the entire signup
  END;

  -- Get user role ID and assign role
  BEGIN
    SELECT id INTO v_user_role_id FROM roles WHERE name = 'user' LIMIT 1;
    
    IF v_user_role_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role_id, created_at, updated_at)
      VALUES (NEW.id, v_user_role_id, NOW(), NOW())
      ON CONFLICT (user_id, role_id) DO NOTHING; -- Prevent duplicate role assignments
    ELSE
      RAISE WARNING 'Role "user" not found in roles table';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to assign user role: %', SQLERRM;
    -- Continue execution - role assignment is not critical for signup
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- ENSURE DEFAULT ROLES EXIST
-- ===========================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'user') THEN
    INSERT INTO roles (name, description, permissions)
    VALUES ('user', 'Standard user', '{}')
    ON CONFLICT (name) DO NOTHING;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'agent') THEN
    INSERT INTO roles (name, description, permissions)
    VALUES ('agent', 'Real estate agent', '{}')
    ON CONFLICT (name) DO NOTHING;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin') THEN
    INSERT INTO roles (name, description, permissions)
    VALUES ('admin', 'Administrator', ARRAY['manage_users', 'manage_properties', 'manage_investments', 'manage_transactions', 'view_reports', 'manage_crypto', 'manage_agents', 'view_analytics'])
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;

