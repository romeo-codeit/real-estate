import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';
import { paymentService } from '@/services/payments/payment.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { ValidationHelper, ValidationSchemas } from '@/lib/validation';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { CSRFProtection } from '@/lib/csrf';

async function depositHandler(request: NextRequest) {
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

    // Validate and sanitize input
    const validation = await ValidationHelper.validateRequest(ValidationSchemas.deposit, request);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validation.errors.issues },
        { status: 400 }
      );
    }

    const { amount, currency, paymentMethod } = validation.data;

    // Check if payment method is supported
    if (!(await paymentService.isMethodSupported(paymentMethod))) {
      return NextResponse.json({ error: 'Payment method not supported' }, { status: 400 });
    }

    // Get user profile for additional metadata
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single();

    let paymentResult;
    let transactionData;

    // Check if it's a crypto payment method
    const cryptoService = (paymentService as any).services.get('crypto');
    const supportedCryptoMethods = await cryptoService.getSupportedMethods();
    const isCryptoMethod = supportedCryptoMethods.some((method: any) => method.id === paymentMethod);

    if (isCryptoMethod) {
      // For crypto deposits, create transaction directly without gateway
      const cryptoType = paymentMethod; // Use the method id directly (e.g., 'bitcoin', 'ethereum')
      const walletAddress = await cryptoService.getWalletAddress(cryptoType);

      transactionData = {
        user_id: user.id,
        type: 'deposit' as const,
        amount,
        currency,
        status: 'pending' as const,
        provider: 'crypto',
        provider_txn_id: `crypto_deposit_${user.id}_${Date.now()}`,
        metadata: {
          payment_method: paymentMethod,
          crypto_type: cryptoType,
          wallet_address: walletAddress,
          initiated_at: new Date().toISOString(),
        }
      };
      paymentResult = {
        success: true,
        paymentId: transactionData.provider_txn_id,
        status: 'pending',
        redirectUrl: null, // No redirect for manual crypto
        walletAddress, // Include address in response
      };
    } else {
      // Create payment intent with the selected gateway
      paymentResult = await paymentService.createPayment(
        paymentMethod,
        amount,
        currency || 'USD',
        user.id,
        {
          email: profile?.email,
          fullName: profile?.full_name,
        }
      );

      if (!paymentResult.success) {
        return NextResponse.json({
          error: paymentResult.error || 'Failed to create payment'
        }, { status: 400 });
      }

      transactionData = {
        user_id: user.id,
        type: 'deposit' as const,
        amount,
        currency,
        status: 'pending' as const,
        provider: paymentMethod,
        provider_txn_id: paymentResult.paymentId || paymentResult.transactionId,
        metadata: {
          payment_id: paymentResult.paymentId,
          payment_method: paymentMethod,
          initiated_at: new Date().toISOString(),
        }
      };
    }

    // Create transaction record in database
    const transaction = await transactionService.createTransaction(transactionData);

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

// Export with CSRF protection
export async function POST(request: NextRequest) {
  // Apply CSRF protection
  const csrfResult = await CSRFProtection.validateRequest(request);
  if (!csrfResult.valid) {
    return csrfResult.response!;
  }

  return depositHandler(request);
}