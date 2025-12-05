import { envConfigs } from '@/constants/constants';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../../../database.types';

export const supabase = createClient<Database>(
  envConfigs.supabase.url as string,
  envConfigs.supabase.key as string
);
