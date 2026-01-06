import 'server-only';
import { envConfigs } from '@/constants/constants';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../database.types';

// Validate required credentials
const supabaseUrl = envConfigs.supabase.url;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables'
  );
}

// Server-side Supabase client with service role key for admin operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Check if service role key is available
export const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;