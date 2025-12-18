import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { ValidationSchemas, ValidationHelper } from '@/lib/validation';
import { CSRFProtection } from '@/lib/csrf';

// Withdrawal API handler
const withdrawHandler = async (request: NextRequest) => {
  try {
    // Per-IP limit to reduce withdrawal abuse / flooding
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'withdraw_post');
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
    
    // Validate and sanitize input
    const validationResult = await ValidationHelper.validate(ValidationSchemas.withdraw, body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.errors },
        { status: 400 }
      );
    }
    
    const { amount, walletAddress, currency = 'USD' } = validationResult.data;

    // Additional business logic validation
    // If the user already has a pending withdrawal, do not allow
    // new ones until an admin reviews the existing request.
    const existingTransactions = await transactionService.getUserTransactions(user.id);
    const pendingWithdrawal = existingTransactions.find(
      (t: any) => t.type === 'withdrawal' && t.status === 'pending'
    );

    if (pendingWithdrawal) {
      return NextResponse.json(
          {
            success: false,
            status: 'pending',
            message:
              'You already have a withdrawal request pending approval by an administrator. Please wait for it to be reviewed before creating a new one.',
            pendingWithdrawal,
          },
          { status: 400 }
        );
      }

      // Check user's available balance before allowing withdrawal
      const { availableToWithdraw } = await transactionService.getUserAvailableBalance(user.id);

      if (amount > availableToWithdraw) {
        return NextResponse.json(
          {
            error: 'Insufficient balance for withdrawal',
            availableToWithdraw,
          },
          { status: 400 }
        );
      }

    // Create withdrawal transaction
    const transaction = await transactionService.createTransaction({
      user_id: user.id,
      type: 'withdrawal',
      amount,
      currency,
      status: 'pending', // Withdrawals typically start as pending for security review
      provider: 'crypto',
      metadata: {
        crypto_type: 'bitcoin', // Default to bitcoin for crypto withdrawals
        wallet_address: walletAddress,
        initiated_at: new Date().toISOString(),
      }
    });

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Withdrawal request submitted successfully'
    });

  } catch (error) {
    console.error('Withdraw API error:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 30 }, 'withdraw_get');
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

    // Get user's withdrawal transactions
    const transactions = await transactionService.getUserTransactions(user.id);
    const withdrawals = transactions.filter((t: any) => t.type === 'withdrawal');

    return NextResponse.json({ withdrawals });

  } catch (error) {
    console.error('Get withdrawals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Apply CSRF protection
  const csrfResult = await CSRFProtection.validateRequest(request);
  if (!csrfResult.valid) {
    return csrfResult.response!;
  }

  return withdrawHandler(request);
}