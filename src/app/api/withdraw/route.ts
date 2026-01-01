import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { ValidationSchemas, ValidationHelper, WITHDRAWAL_LIMITS, KYC_THRESHOLDS } from '@/lib/validation';
import { CSRFProtection } from '@/lib/csrf';
import { requireEmailVerified } from '@/lib/auth-utils';

// Get withdrawal limits based on KYC status
function getWithdrawalLimits(kycStatus: string) {
  switch (kycStatus) {
    case 'verified':
      return WITHDRAWAL_LIMITS.VERIFIED;
    case 'pending':
      return WITHDRAWAL_LIMITS.PENDING;
    case 'rejected':
      return WITHDRAWAL_LIMITS.REJECTED;
    default:
      return WITHDRAWAL_LIMITS.NONE;
  }
}

// Withdrawal API handler
const withdrawHandler = async (request: NextRequest) => {
  try {
    // Per-IP limit to reduce withdrawal abuse / flooding
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'withdraw_post');
    if (!limit.ok && limit.response) return limit.response;

    // Verify user authentication AND email verification
    const userOrResponse = await requireEmailVerified(request);
    if (userOrResponse instanceof NextResponse) return userOrResponse;
    const authUser = userOrResponse;

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

    // Get user's KYC status and withdrawal info
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('kyc_status, kyc_verified_at, daily_withdrawal_limit, total_withdrawn_today, last_withdrawal_date')
      .eq('id', authUser.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'Failed to verify user status' }, { status: 500 });
    }

    const kycStatus = userData?.kyc_status || 'none';
    const limits = getWithdrawalLimits(kycStatus);

    // Check if KYC is rejected - block all withdrawals
    if (kycStatus === 'rejected') {
      return NextResponse.json({
        error: 'Withdrawals are blocked due to KYC rejection',
        code: 'KYC_REJECTED',
        message: 'Your identity verification was rejected. Please contact support.'
      }, { status: 403 });
    }

    // Check per-transaction limit
    if (amount > limits.perTransaction) {
      return NextResponse.json({
        error: `Maximum withdrawal per transaction is $${limits.perTransaction.toLocaleString()} with your current verification level`,
        code: 'EXCEEDS_TRANSACTION_LIMIT',
        limit: limits.perTransaction,
        kycStatus,
        suggestion: kycStatus !== 'verified' ? 'Complete KYC verification to increase your limits' : null
      }, { status: 400 });
    }

    // Check if KYC is required for this amount
    if (amount > KYC_THRESHOLDS.REQUIRE_FOR_WITHDRAWAL_ABOVE && kycStatus !== 'verified') {
      return NextResponse.json({
        error: `KYC verification required for withdrawals above $${KYC_THRESHOLDS.REQUIRE_FOR_WITHDRAWAL_ABOVE.toLocaleString()}`,
        code: 'KYC_REQUIRED',
        threshold: KYC_THRESHOLDS.REQUIRE_FOR_WITHDRAWAL_ABOVE,
        kycStatus,
        message: 'Please complete identity verification to withdraw this amount.'
      }, { status: 403 });
    }

    // Calculate today's total withdrawn
    const today = new Date().toISOString().split('T')[0];
    const isNewDay = userData?.last_withdrawal_date !== today;
    const totalWithdrawnToday = isNewDay ? 0 : (userData?.total_withdrawn_today || 0);

    // Check daily limit
    if (totalWithdrawnToday + amount > limits.daily) {
      const remaining = limits.daily - totalWithdrawnToday;
      return NextResponse.json({
        error: `Daily withdrawal limit exceeded. You can withdraw up to $${remaining.toLocaleString()} more today.`,
        code: 'DAILY_LIMIT_EXCEEDED',
        dailyLimit: limits.daily,
        withdrawnToday: totalWithdrawnToday,
        remaining: Math.max(0, remaining),
        kycStatus,
        suggestion: kycStatus !== 'verified' ? 'Complete KYC verification to increase your daily limit' : null
      }, { status: 400 });
    }

    // Determine if admin approval is required
    const requiresApproval = amount > limits.requiresApproval;
    const withdrawalStatus = requiresApproval ? 'pending_approval' : 'pending';

    // Create withdrawal transaction atomically
    let transaction;
    try {
      transaction = await transactionService.createWithdrawal({
        user_id: authUser.id,
        amount,
        currency,
        provider: 'crypto',
        metadata: {
          crypto_type: 'bitcoin',
          wallet_address: walletAddress,
          initiated_at: new Date().toISOString(),
          kyc_status: kycStatus,
          requires_approval: requiresApproval,
        }
      });

      // Update user's daily withdrawal tracking
      await supabaseAdmin
        .from('users')
        .update({
          total_withdrawn_today: totalWithdrawnToday + amount,
          last_withdrawal_date: today,
        })
        .eq('id', authUser.id);

    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || 'Failed to process withdrawal' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction,
      requiresApproval,
      message: requiresApproval
        ? 'Withdrawal request submitted. Pending admin approval due to amount.'
        : 'Withdrawal request submitted successfully'
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