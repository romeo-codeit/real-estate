import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payments/payment.service';
import transactionService from '@/services/supabase/transaction.service';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || undefined;

    // First, verify the webhook signature using the raw body
    const processed = await paymentService.processWebhook('stripe', body, signature);

    if (!processed) {
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
    }

    // Parse the payload after successful signature verification
    const payload = JSON.parse(body);

    // Handle successful payment
    if (payload.type === 'payment_intent.succeeded') {
      const paymentIntent = payload.data.object;

      // Update transaction status to completed and record gateway confirmation
      const transaction = await transactionService.updateTransactionStatus(
        paymentIntent.metadata?.userId,
        paymentIntent.id,
        'completed',
        {
          source: 'gateway_webhook',
          method: 'stripe',
          idempotencyKey: payload.id, // Stripe event ID
        }
      );

      // Log webhook event for diagnostics
      await (supabaseAdmin as any).from('webhook_events').insert({
        provider: 'stripe',
        event_id: payload.id,
        event_type: payload.type,
        status: 'processed',
        transaction_id: transaction.id,
        provider_txn_id: paymentIntent.id,
        target_status: 'completed',
        payload,
      });

      console.log('Stripe payment completed:', paymentIntent.id, 'Transaction:', transaction.id);
    }

    if (payload.type === 'payment_intent.payment_failed') {
      const paymentIntent = payload.data.object;

      // Update transaction status to failed with gateway context
      await transactionService.updateTransactionStatus(
        paymentIntent.metadata?.userId,
        paymentIntent.id,
        'failed',
        {
          source: 'gateway_webhook',
          method: 'stripe',
          idempotencyKey: payload.id,
        }
      );

      await (supabaseAdmin as any).from('webhook_events').insert({
        provider: 'stripe',
        event_id: payload.id,
        event_type: payload.type,
        status: 'processed',
        transaction_id: null,
        provider_txn_id: paymentIntent.id,
        target_status: 'failed',
        payload,
      });

      console.log('Stripe payment failed:', paymentIntent.id);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}