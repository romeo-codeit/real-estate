/**
 * Environment variable validation
 * Runs at startup to ensure all required config is present
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  description: string;
}

const ENV_VARS: EnvVarConfig[] = [
  // Supabase
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    description: 'Supabase service role key (server-only)'
  },

  // Sanity
  {
    name: 'NEXT_PUBLIC_SANITY_PROJECT_ID',
    required: true,
    description: 'Sanity project ID'
  },
  {
    name: 'NEXT_PUBLIC_SANITY_DATASET',
    required: true,
    description: 'Sanity dataset name'
  },
  {
    name: 'SANITY_API_TOKEN',
    required: true,
    description: 'Sanity API token'
  },

  // AI/ML
  {
    name: 'GOOGLE_AI_API_KEY',
    required: true,
    description: 'Google AI (Gemini) API key'
  },

  // Payments
  {
    name: 'PAYSTACK_SECRET_KEY',
    required: true,
    description: 'Paystack secret key (server-only)'
  },

  // Crypto (managed via admin dashboard)
  {
    name: 'NEXT_PUBLIC_USDT_WALLET_ADDRESS',
    required: false,
    description: 'USDT wallet address (can be managed via admin dashboard instead)'
  },

  // Webhooks & Security
  {
    name: 'ADMIN_SETUP_SECRET',
    required: true,
    description: 'Secret key for initial admin creation'
  },
  {
    name: 'WEBHOOK_SECRET',
    required: true,
    description: 'Secret key for webhook validation'
  },

  // Sentry (optional)
  {
    name: 'NEXT_PUBLIC_SENTRY_AUTH_TOKEN',
    required: false,
    description: 'Sentry authentication token'
  },
];

/**
 * Validate all required environment variables
 * Throws error if any required variable is missing or empty
 */
export function validateEnvVars(): void {
  const missing: string[] = [];
  const empty: string[] = [];

  for (const config of ENV_VARS) {
    const value = process.env[config.name];

    if (value === undefined || value === null) {
      if (config.required) {
        missing.push(`${config.name} - ${config.description}`);
      }
    } else if (value.trim() === '') {
      if (config.required) {
        empty.push(`${config.name} - ${config.description}`);
      }
    }
  }

  if (missing.length > 0 || empty.length > 0) {
    const errors = [];
    if (missing.length > 0) {
      errors.push('Missing required environment variables:\n  - ' + missing.join('\n  - '));
    }
    if (empty.length > 0) {
      errors.push('Empty required environment variables:\n  - ' + empty.join('\n  - '));
    }
    throw new Error('Environment validation failed:\n' + errors.join('\n\n'));
  }

  console.log('✅ All required environment variables are configured');
}

export default validateEnvVars;
