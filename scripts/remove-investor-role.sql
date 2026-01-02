-- Remove investor role from the system
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  v_investor_role_id UUID;
  v_user_role_id UUID;
BEGIN
  -- Get investor role ID
  SELECT id INTO v_investor_role_id FROM roles WHERE name = 'investor';
  
  -- Get user role ID (to reassign any investors to user role)
  SELECT id INTO v_user_role_id FROM roles WHERE name = 'user';
  
  IF v_investor_role_id IS NOT NULL THEN
    -- Update any user_roles assignments from investor to user
    UPDATE user_roles 
    SET role_id = v_user_role_id, updated_at = NOW()
    WHERE role_id = v_investor_role_id;
    RAISE NOTICE 'Updated user_roles assignments';
    
    -- Update any profiles with investor role_id to user
    UPDATE profiles 
    SET role_id = v_user_role_id, updated_at = NOW()
    WHERE role_id = v_investor_role_id;
    RAISE NOTICE 'Updated profiles with investor role';
    
    -- Delete the investor role
    DELETE FROM roles WHERE id = v_investor_role_id;
    RAISE NOTICE '✅ Investor role deleted';
  ELSE
    RAISE NOTICE 'Investor role not found';
  END IF;
  
  -- Update agent role to have same permissions as user (basic access)
  UPDATE roles
  SET 
    description = 'Agent access (same as user for now)',
    permissions = ARRAY[]::text[],
    updated_at = NOW()
  WHERE name = 'agent';
  RAISE NOTICE '✅ Agent permissions updated to match user';
  
  RAISE NOTICE '✅ Role cleanup complete';
END $$;
