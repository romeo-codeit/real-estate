import { envConfigs } from '@/constants/constants';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../../database.types';

export const supabase = createBrowserClient<Database>(
  envConfigs.supabase.url as string,
  envConfigs.supabase.key as string
);
