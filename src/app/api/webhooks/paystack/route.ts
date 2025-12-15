import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payments/payment.service';
import transactionService from '@/services/supabase/transaction.service';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-paystack-signature') || undefined;

    // Process Paystack webhook
    const processed = await paymentService.processWebhook('paystack', body, signature);

    if (!processed) {
      return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
    }

    // Handle successful payment
    if (body.event === 'charge.success') {
      const transaction = body.data;

      // Update transaction status to completed and record gateway confirmation
      const updatedTransaction = await transactionService.updateTransactionStatus(
        transaction.metadata?.userId,
        transaction.reference,
        'completed',
        {
          source: 'gateway_webhook',
          method: 'paystack',
          idempotencyKey: String(transaction.id ?? transaction.reference),
        }
      );

      await (supabaseAdmin as any).from('webhook_events').insert({
        provider: 'paystack',
        event_id: String(transaction.id ?? transaction.reference),
        event_type: body.event,
        status: 'processed',
        transaction_id: updatedTransaction.id,
        provider_txn_id: transaction.reference,
        target_status: 'completed',
        payload: body,
      });

      console.log('Paystack payment completed:', transaction.reference, 'Transaction:', updatedTransaction.id);
    }

    if (body.event === 'charge.failed') {
      const transaction = body.data;

      // Update transaction status to failed with gateway context
      await transactionService.updateTransactionStatus(
        transaction.metadata?.userId,
        transaction.reference,
        'failed',
        {
          source: 'gateway_webhook',
          method: 'paystack',
          idempotencyKey: String(transaction.id ?? transaction.reference),
        }
      );

      await (supabaseAdmin as any).from('webhook_events').insert({
        provider: 'paystack',
        event_id: String(transaction.id ?? transaction.reference),
        event_type: body.event,
        status: 'processed',
        transaction_id: null,
        provider_txn_id: transaction.reference,
        target_status: 'failed',
        payload: body,
      });

      console.log('Paystack payment failed:', transaction.reference);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}