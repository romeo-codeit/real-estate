# Payment Gateway Configuration

## Required Environment Variables

### Stripe
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Paystack
```bash
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
```

### PayPal
```bash
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox  # or 'production'
```

### General
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Your app URL
```

## Webhook URLs

Configure these webhook URLs in your payment gateway dashboards:

### Stripe
- Webhook URL: `https://yourdomain.com/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

### Paystack
- Webhook URL: `https://yourdomain.com/api/webhooks/paystack`
- Events: `charge.success`, `charge.failed`

### PayPal
- Webhook URL: `https://yourdomain.com/api/webhooks/paypal`
- Events: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`

## Testing

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`

### Paystack Test Cards
- Success: `4084084084084081`
- Declined: `4084084084084082`

### PayPal
Use PayPal sandbox accounts for testing.