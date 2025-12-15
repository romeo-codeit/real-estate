import 'server-only';
import { envConfigs } from '@/constants/constants';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../database.types';

// Server-side Supabase client with service role key for admin operations
export const supabaseAdmin = createClient<Database>(
  envConfigs.supabase.url as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Check if service role key is available
export const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;