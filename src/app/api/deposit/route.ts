import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';
import { paymentService } from '@/services/payments/payment.service';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Basic per-IP rate limiting to prevent gateway abuse
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'deposit_post');
    if (!limit.ok && limit.response) return limit.response;

    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { amount, paymentMethod, currency = 'USD', email } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'Payment method is required' }, { status: 400 });
    }

    // Check if payment method is supported
    if (!paymentService.isMethodSupported(paymentMethod)) {
      return NextResponse.json({ error: 'Payment method not supported' }, { status: 400 });
    }

    // Get user profile for additional metadata
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    // Create payment intent with the selected gateway
    const paymentResult = await paymentService.createPayment(
      paymentMethod,
      amount,
      currency,
      user.id,
      {
        email: email || profile?.email,
        fullName: profile?.full_name,
      }
    );

    if (!paymentResult.success) {
      return NextResponse.json({
        error: paymentResult.error || 'Failed to create payment'
      }, { status: 400 });
    }

    // Create transaction record in database
    // Link provider_txn_id to the gateway's primary payment identifier so
    // webhooks and verification endpoints can settle this transaction.
    const transaction = await transactionService.createTransaction({
      user_id: user.id,
      type: 'deposit',
      amount,
      currency,
      status: 'pending',
      provider: paymentMethod,
      provider_txn_id: paymentResult.paymentId || paymentResult.transactionId,
      metadata: {
        payment_id: paymentResult.paymentId,
        payment_method: paymentMethod,
        initiated_at: new Date().toISOString(),
      }
    });

    return NextResponse.json({
      success: true,
      transaction,
      payment: {
        id: paymentResult.paymentId,
        status: paymentResult.status,
        redirectUrl: paymentResult.redirectUrl,
      },
      message: 'Deposit initiated successfully'
    });
  } catch (error) {
    console.error('Deposit API error:', error);
    return NextResponse.json(
      { error: 'Failed to process deposit' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 30 }, 'deposit_get');
    if (!limit.ok && limit.response) return limit.response;

    // Verify user authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's deposit transactions
    const transactions = await transactionService.getUserTransactions(user.id);
    const deposits = transactions.filter((t: any) => t.type === 'deposit');

    return NextResponse.json({ deposits });

  } catch (error) {
    console.error('Get deposits API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}