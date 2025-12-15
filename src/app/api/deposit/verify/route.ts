import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import { paymentService } from '@/services/payments/payment.service';
import transactionService from '@/services/supabase/transaction.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');
    const method = searchParams.get('method');

    if (!paymentId || !method) {
      return NextResponse.json({ error: 'Missing payment information' }, { status: 400 });
    }

    // Get payment status from the gateway
    const paymentStatus = await paymentService.getPaymentStatus(method, paymentId);

    if (!paymentStatus) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update transaction status in database if payment is completed
    if (paymentStatus.status === 'completed') {
      try {
        await transactionService.updateTransactionStatus(
          undefined,
          paymentId,
          'completed',
          {
            source: 'gateway_verify',
            method,
            idempotencyKey: `deposit_verify_${method}_${paymentId}`,
          }
        );
      } catch (error) {
        console.error('Error updating transaction via verify endpoint:', error);
      }
    }

    return NextResponse.json({
      success: paymentStatus.status === 'completed',
      status: paymentStatus.status,
      amount: paymentStatus.amount,
      currency: paymentStatus.currency,
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({
      error: 'Failed to verify payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}