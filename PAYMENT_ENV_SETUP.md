# Payment Gateway Environment Variables Setup Guide

## Required Environment Variables for Production

### Stripe Configuration
```bash
# Get these from https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_live_...  # Live publishable key
STRIPE_SECRET_KEY=sk_live_...      # Live secret key
STRIPE_WEBHOOK_SECRET=whsec_...    # Webhook endpoint secret
```

### PayPal Configuration
```bash
# Get these from https://developer.paypal.com/dashboard/applications
PAYPAL_CLIENT_ID=your_live_paypal_client_id
PAYPAL_CLIENT_SECRET=your_live_paypal_client_secret
PAYPAL_ENVIRONMENT=production  # Change from 'sandbox' to 'production'
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id  # From webhook setup
```

### Paystack Configuration
```bash
# Get these from https://dashboard.paystack.com/settings/developer
PAYSTACK_PUBLIC_KEY=pk_live_...   # Live public key
PAYSTACK_SECRET_KEY=sk_live_...   # Live secret key
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret
```

### Application URL
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Your production domain
```

## Webhook URL Configuration

### In Stripe Dashboard:
1. Go to https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### In PayPal Developer Dashboard:
1. Go to https://developer.paypal.com/dashboard/webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paypal`
3. Select events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`
4. Copy webhook ID to `PAYPAL_WEBHOOK_ID`

### In Paystack Dashboard:
1. Go to https://dashboard.paystack.com/settings/developer
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`
3. Copy webhook secret to `PAYSTACK_WEBHOOK_SECRET`

## Testing Your Configuration

Run this command to validate your payment gateway setup:

```bash
npm run test:payment-config
```

This will check:
- All required environment variables are set
- Webhook endpoints are accessible
- API keys have correct format
- Gateway connectivity (if possible)

## Common Issues & Solutions

### 1. Payments Appear to Work But Don't Complete
- **Cause**: Webhook URLs not configured in gateway dashboards
- **Fix**: Ensure webhook URLs point to your production domain

### 2. Webhook Signature Verification Fails
- **Cause**: Wrong webhook secrets in environment variables
- **Fix**: Copy exact secrets from gateway dashboards

### 3. CORS Errors in Development
- **Cause**: Using production webhook URLs in development
- **Fix**: Use ngrok or similar for local webhook testing

### 4. Environment Variables Not Loading
- **Cause**: Server restart required after .env changes
- **Fix**: Restart your Next.js server

## Security Notes

- Never commit real API keys to version control
- Use different keys for development and production
- Regularly rotate API keys
- Monitor webhook logs for suspicious activity
- Use HTTPS in production (required by payment gateways)