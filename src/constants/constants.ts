export const envConfigs = {
  sanity: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
    useCdn: process.env.NODE_ENV === 'production',
    token: process.env.SANITY_API_TOKEN,
  },
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export const bankingConfig = {
  bankName: 'RealVest Bank',
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || '••••••••••••1234',
  routingNumber: process.env.BANK_ROUTING_NUMBER || '•••••••••••4321',
  reference: 'Your Full Name',
};
