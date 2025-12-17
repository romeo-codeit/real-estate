#!/usr/bin/env node

/**
 * Payment Gateway Configuration Validator
 * Validates that all required environment variables are set and have correct format
 */

const requiredVars = {
  // Stripe
  STRIPE_PUBLISHABLE_KEY: {
    pattern: /^pk_(test|live)_/,
    description: 'Stripe publishable key'
  },
  STRIPE_SECRET_KEY: {
    pattern: /^sk_(test|live)_/,
    description: 'Stripe secret key'
  },
  STRIPE_WEBHOOK_SECRET: {
    pattern: /^whsec_/,
    description: 'Stripe webhook secret'
  },

  // PayPal
  PAYPAL_CLIENT_ID: {
    pattern: /^[A-Za-z0-9_-]+$/,
    description: 'PayPal client ID'
  },
  PAYPAL_CLIENT_SECRET: {
    pattern: /^[A-Za-z0-9_-]+$/,
    description: 'PayPal client secret'
  },
  PAYPAL_ENVIRONMENT: {
    pattern: /^(sandbox|production)$/,
    description: 'PayPal environment (sandbox/production)'
  },

  // Paystack
  PAYSTACK_PUBLIC_KEY: {
    pattern: /^pk_(test|live)_/,
    description: 'Paystack public key'
  },
  PAYSTACK_SECRET_KEY: {
    pattern: /^sk_(test|live)_/,
    description: 'Paystack secret key'
  },

  // General
  NEXT_PUBLIC_APP_URL: {
    pattern: /^https?:\/\/.+/,
    description: 'Application URL'
  }
};

function validateEnvVar(name, value, config) {
  if (!value) {
    return { valid: false, error: `${name} is not set` };
  }

  if (!config.pattern.test(value)) {
    return { valid: false, error: `${name} has invalid format` };
  }

  return { valid: true };
}

function checkWebhookUrls() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return;

  const webhooks = [
    `${appUrl}/api/webhooks/stripe`,
    `${appUrl}/api/webhooks/paypal`,
    `${appUrl}/api/webhooks/paystack`
  ];

  console.log('\n📡 Webhook URLs (configure these in gateway dashboards):');
  webhooks.forEach(url => console.log(`   ${url}`));
}

function main() {
  console.log('🔍 Validating Payment Gateway Configuration...\n');

  let allValid = true;
  const results = [];

  for (const [varName, config] of Object.entries(requiredVars)) {
    const value = process.env[varName];
    const result = validateEnvVar(varName, value, config);

    if (result.valid) {
      const isTest = value.includes('test') || value.includes('sandbox');
      const status = isTest ? '🧪 TEST' : '✅ PROD';
      console.log(`${status} ${varName}: ${config.description}`);
    } else {
      console.log(`❌ ${varName}: ${result.error}`);
      allValid = false;
    }

    results.push({ varName, ...result, description: config.description });
  }

  checkWebhookUrls();

  console.log('\n' + '='.repeat(50));

  if (allValid) {
    console.log('✅ All payment gateway environment variables are properly configured!');
    console.log('\n📋 Next Steps:');
    console.log('1. Configure webhook URLs in each gateway dashboard');
    console.log('2. Test payments in your application');
    console.log('3. Monitor webhook logs for successful processing');
  } else {
    console.log('❌ Configuration issues found. Please fix the errors above.');
    console.log('\n📖 See PAYMENT_ENV_SETUP.md for detailed setup instructions.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateEnvVar, requiredVars };