import { envConfigs } from '@/constants/constants';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../database.types';

export const supabase = createClient<Database>(
  envConfigs.supabase.url as string,
  envConfigs.supabase.key as string,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'realestate-auth-token',
      flowType: 'pkce'
    }
  }
);
