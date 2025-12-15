import { envConfigs } from '@/constants/constants';
import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: envConfigs.sanity.projectId || 'bw556xju',
  dataset: envConfigs.sanity.dataset || 'production',
  useCdn: envConfigs.sanity.useCdn,
  apiVersion: envConfigs.sanity.apiVersion || '2024-01-01',
  token: envConfigs.sanity.token,
});
