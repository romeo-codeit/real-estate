# Payment Gateway Environment Variables Setup Guide

## 🌍 Geographic Availability

### Nigeria-Specific Recommendations:
- **🇳🇬 Paystack**: ✅ **PRIMARY CHOICE** - Built for Nigeria & Africa
- **💳 PayPal**: ✅ Works in Nigeria (may have fees)
- **⚡ Stripe**: ❌ **NOT AVAILABLE** in Nigeria (Stripe doesn't operate there)

### Why Paystack is Best for Nigeria:
- Local banking integration
- Lower fees (1.5% vs 2.9%+)
- Naira currency support
- Bank transfers, cards, USSD
- No international restrictions

### ⚠️ PayPal Restrictions in Nigeria (2025):
- **Account Limits:** PayPal frequently restricts/limits Nigerian accounts
- **Withdrawal Issues:** Difficult/impossible to withdraw to Nigerian banks
- **Chargeback Problems:** High rates lead to account closures
- **Recommendation:** Use only as secondary option, not for Nigerian users

## 🇳🇬 Paystack Business Requirements

### For **TEST Accounts** (Development):
- ✅ **NO CAC required** - Just email verification
- ✅ **NO business registration** needed
- ✅ **Instant activation** after email confirmation
- ✅ **Full API access** for testing

### For **LIVE Accounts** (Production):
- ⚠️ **Business registration** recommended (not always mandatory)
- 📋 **CAC registration** may be required for high-volume businesses
- 🏦 **Bank account** verification required
- 📱 **Phone & ID verification** required

### Paystack Account Tiers:
1. **Starter** (₦0/month) - Basic features, lower limits
2. **Business** (₦5,000/month) - Full features, higher limits  
3. **Enterprise** - Custom pricing, dedicated support

**For your real estate platform:** Start with test account, upgrade to live when ready to launch.
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
PAYSTACK_PUBLIC_KEY=pk_test_...   # Test public key
PAYSTACK_SECRET_KEY=sk_test_...   # Test secret key
# PAYSTACK_WEBHOOK_SECRET=         # NOT NEEDED - Paystack uses SECRET_KEY for webhook verification
```

**Important:** Paystack does NOT provide a separate webhook secret. They use your **SECRET KEY** to verify webhook signatures using HMAC-SHA512.

### Application URL
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com  # Your production domain
```

## Webhook URL Configuration

### In PayPal Developer Dashboard:
1. Go to https://developer.paypal.com/dashboard/webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paypal`
3. Select events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`
4. Copy webhook ID to `PAYPAL_WEBHOOK_ID`

### In Paystack Dashboard:
1. Go to https://dashboard.paystack.com/settings/developer
2. Add webhook URL: `https://yourdomain.com/api/webhooks/paystack`
3. **No webhook secret needed** - Paystack uses your SECRET KEY for verification
4. Select events: `charge.success`, `charge.failed`

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