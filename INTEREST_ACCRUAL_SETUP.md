# Interest Accrual & Auto-Polling Setup

## Environment Variables

Add the following to your `.env.production`:

```
# Cron job authentication (generate a strong random secret)
CRON_SECRET=your-strong-random-secret-here
```

For local development, add to `.env.local`:

```
CRON_SECRET=test-cron-secret-dev
```

Generate a strong secret:
```bash
openssl rand -base64 32
```

## Vercel Deployment

The cron jobs are configured in `vercel.json`:

1. **Blog Post Generation** - Runs daily at 9:00 AM UTC
   - Endpoint: `/api/generate-blog-posts`
   - Schedule: `0 9 * * *`

2. **Interest Accrual** - Runs daily at 12:00 AM UTC (midnight)
   - Endpoint: `/api/cron/accrue-interest`
   - Schedule: `0 0 * * *`

## How It Works

### Auto-Polling (Client-Side)

Both the user dashboard and admin transactions page now automatically poll for updates when there are pending items:

- **User Dashboard**: Polls every 15 seconds when there are pending transactions or investments
- **Admin Transactions**: Polls every 15 seconds when there are pending crypto approvals
- Polling automatically stops when all items are completed
- User can also manually click "Refresh" button to force an update

### Interest Accrual (Server-Side)

The `/api/cron/accrue-interest` endpoint:

1. Runs daily at midnight UTC
2. Verifies the `CRON_SECRET` header
3. Queries all active investments with `start_date` set
4. For each investment:
   - Calculates compound interest accrued since last run
   - Creates a "payout" transaction for the interest amount
   - Records the accrual in investment metadata to prevent double-counting
5. Returns summary of processed investments and total accrued

## Testing

### Manual Trigger (Development)

```bash
# Test the cron endpoint locally
curl -X POST http://localhost:3000/api/cron/accrue-interest \
  -H "Authorization: Bearer test-cron-secret-dev"

# Or use the GET endpoint with query param
curl "http://localhost:3000/api/cron/accrue-interest?secret=test-cron-secret-dev"
```

### In Production (Vercel)

Once deployed, cron jobs are automatically triggered by Vercel at the scheduled times. Monitor execution in the Vercel dashboard under "Cron Jobs".

## How Users See Interest

1. **Real-time Display**: Dashboard shows accrued ROI calculated on-the-fly (not waiting for cron job)
2. **Ledger Entry**: When cron runs, a payout transaction is created (viewable in transaction history)
3. **Available Balance**: Once payout transaction completes, interest adds to user's available balance

## Preventing Double-Accrual

The system tracks the last accrual date in the investment's metadata field:
- Key: `interest_accrued_YYYY-MM-DD`
- Value: `true`

This ensures each investment only accrues interest once per day, even if the cron job retries.
