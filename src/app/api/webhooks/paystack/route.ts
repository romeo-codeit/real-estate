import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payments/payment.service';
import transactionService from '@/services/supabase/transaction.service';
import { webhookService } from '@/services/supabase/webhook.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-paystack-signature') || undefined;

    // 1. Verify Signature (Delegate to service)
    const verified = await paymentService.processWebhook('paystack', body, request);
    if (!verified) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // 2. Idempotency Check
    const eventId = String(body.data?.id || body.data?.reference);
    const { id: webhookId, isNew, status } = await webhookService.recordEvent(
      'paystack',
      eventId,
      body.event,
      body
    );

    if (!isNew && status === 'processed') {
      console.log('Event already processed:', eventId);
      return NextResponse.json({ received: true });
    }

    // 3. Process Event
    if (body.event === 'charge.success') {
      const transaction = body.data;

      try {
        const updatedTransaction = await transactionService.updateTransactionStatus(
          transaction.metadata?.userId,
          transaction.reference,
          'completed',
          {
            source: 'gateway_webhook',
            method: 'paystack',
            idempotencyKey: eventId,
          }
        );

        await webhookService.updateEventStatus(webhookId, 'processed', {
          transaction_id: updatedTransaction.id,
          provider_txn_id: transaction.reference,
          target_status: 'completed'
        });

      } catch (err: any) {
        console.error('Failed to process Paystack success:', err);
        await webhookService.updateEventStatus(webhookId, 'failed', {
          error_message: err.message
        });
        return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
      }
    } else if (body.event === 'charge.failed') {
      const transaction = body.data;

      try {
        await transactionService.updateTransactionStatus(
          transaction.metadata?.userId,
          transaction.reference,
          'failed',
          {
            source: 'gateway_webhook',
            method: 'paystack',
            idempotencyKey: eventId,
          }
        );

        await webhookService.updateEventStatus(webhookId, 'processed', {
          provider_txn_id: transaction.reference,
          target_status: 'failed'
        });

      } catch (err: any) {
        console.error('Failed to process Paystack failure:', err);
        await webhookService.updateEventStatus(webhookId, 'failed', {
          error_message: err.message
        });
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}