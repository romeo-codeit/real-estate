# Payment Gateway Integration

This project now supports multiple payment gateways for deposits, with cryptocurrency as the primary method.

## Supported Payment Methods

### 1. Cryptocurrency (Primary)
- **Bitcoin (BTC)** - Primary funding method
- **Ethereum (ETH)** - Available but disabled by default
- Direct wallet address deposits
- Manual confirmation process

### 2. Stripe
- Credit/Debit card payments
- Instant processing
- 2.9% + 30¢ fees
- Webhook support for automatic confirmations

### 3. PayPal
- PayPal account payments
- Instant processing
- 2.9% + 30¢ fees
- Redirect-based checkout

### 4. Paystack
- Card payments optimized for Africa
- Bank transfers
- 1.5% fees (capped at ₦2,000)
- Nigerian Naira support

### 5. Wire Transfer
- Traditional bank wire transfers
- Manual processing
- No gateway fees

## Environment Variables Setup

Add these to your `.env` file:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_CLIENT_SECRET=your_paypal_client_secret_here
PAYPAL_ENVIRONMENT=sandbox  # or 'production'

# Paystack Configuration
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key_here
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key_here
PAYSTACK_WEBHOOK_SECRET=your_paystack_webhook_secret_here

# Crypto Configuration
BTC_WALLET_ADDRESS=bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
```

## Gateway Setup Instructions

### Stripe Setup
1. Create a Stripe account at https://stripe.com
2. Get your API keys from the dashboard
3. Set up webhooks for `payment_intent.succeeded` events
4. Point webhook URL to: `https://yourdomain.com/api/webhooks/stripe`

### PayPal Setup
1. Create a PayPal Business account
2. Create an app in PayPal Developer Dashboard
3. Get Client ID and Secret
4. Configure webhook URL: `https://yourdomain.com/api/webhooks/paypal`

### Paystack Setup
1. Create a Paystack account at https://paystack.com
2. Get your API keys from the dashboard
3. Set up webhooks for charge events
4. Configure webhook URL: `https://yourdomain.com/api/webhooks/paystack`

## Webhook Endpoints

- **Stripe**: `POST /api/webhooks/stripe`
- **PayPal**: `POST /api/webhooks/paypal`
- **Paystack**: `POST /api/webhooks/paystack`

## Payment Flow

1. User selects payment method and amount
2. System creates payment intent with selected gateway
3. User is redirected to gateway checkout (except crypto)
4. Gateway processes payment
5. Webhook notifies system of completion
6. Transaction status updated to 'completed'
7. User balance updated automatically

## Crypto Deposits

For cryptocurrency deposits:
1. User sees BTC wallet address
2. User sends crypto to the address
3. Admin manually confirms receipt
4. Transaction status updated via admin panel

## Testing

### Test Cards (Stripe)
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

### Paystack Test Keys
Use test keys provided by Paystack dashboard

## Security Notes

- All webhook endpoints verify signatures
- Payment data is encrypted in transit
- Never store sensitive payment information
- Use HTTPS in production
- Regularly rotate API keys

## Troubleshooting

### Common Issues
1. **Webhook signatures fail**: Check webhook secrets in environment variables
2. **Payment redirects fail**: Verify callback URLs are correct
3. **Crypto confirmations slow**: Manual process - admin needs to check blockchain

### Logs
Check server logs for payment processing errors:
- Stripe errors in `/api/webhooks/stripe`
- PayPal errors in `/api/webhooks/paypal`
- Paystack errors in `/api/webhooks/paystack`