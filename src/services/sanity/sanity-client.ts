import { envConfigs } from '@/constants/constants';
import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  projectId: envConfigs.sanity.projectId,
  dataset: envConfigs.sanity.dataset,
  useCdn: envConfigs.sanity.useCdn,
  apiVersion: envConfigs.sanity.apiVersion,
  token: envConfigs.sanity.token,
});
