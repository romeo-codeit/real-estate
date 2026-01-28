import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/services/payments/payment.service';
import { requireEmailVerified } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    // Ensure the caller is authenticated and has a verified email before we hit the gateway
    const userOrResponse = await requireEmailVerified(request);
    if (userOrResponse instanceof NextResponse) return userOrResponse;

    const { reference } = await request.json();

    if (!reference) {
      return NextResponse.json({ error: 'Missing payment reference' }, { status: 400 });
    }

    // Confirm payment with Paystack
    const result = await paymentService.confirmPayment('paystack', reference);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        transactionId: result.transactionId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Payment verification failed'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Paystack verification error:', error);
    return NextResponse.json({
      error: 'Failed to verify Paystack payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}