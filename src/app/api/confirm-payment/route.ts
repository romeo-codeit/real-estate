import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { requireAdmin } from '@/lib/auth-utils';
import { CSRFProtection } from '@/lib/csrf';

async function confirmPaymentHandler(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'confirm_payment_post');
  if (!limit.ok && limit.response) return limit.response;

  try {
    // Authenticate user (Admin or Regular)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.substring(7);
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userRole } = await supabaseAdmin
      .from('user_roles')
      .select('roles!inner(name)')
      .eq('user_id', authUser.id)
      .eq('roles.name', 'admin')
      .single();

    const isAdmin = !!userRole;
    const user = { id: authUser.id, email: authUser.email };

    // Parse request body
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Get the transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('type', 'investment')
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Ensure users can only modify their own transactions
    if (!isAdmin && transaction.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 });
    }

    // USER FLOW: Claim Crypto Payment
    if (transaction.provider === 'crypto') {
      // Both Admin and User can trigger this state transition for crypto
      // But usually Admin would use the "Verify" endpoint which sets it to COMPLETED.
      // This endpoint, when called by User, should set it to 'waiting_confirmation'.

      const updatedTransaction = await transactionService.updateTransactionStatus(
        transaction.user_id || undefined,
        transaction.provider_txn_id || transactionId,
        'waiting_confirmation',
        {
          source: 'manual_claim',
          method: 'crypto',
          note: `Payment claimed by ${isAdmin ? 'admin' : 'user'} at ${new Date().toISOString()}`,
        }
      );

      return NextResponse.json({
        success: true,
        transaction: updatedTransaction,
        message: 'Payment claim submitted. Waiting for admin approval.'
      });
    }

    // ADMIN FLOW: Confirm Non-Crypto Payment (Manual Override)
    if (isAdmin) {
      const updatedTransaction = await transactionService.updateTransactionStatus(
        transaction.user_id || undefined,
        transaction.provider_txn_id || transactionId,
        'completed',
        {
          source: 'manual_confirm',
          method: transaction.provider || 'unknown',
          note: `Manual confirmation by admin ${user.email}`,
          idempotencyKey: `confirm_payment_${transaction.id}`,
        }
      );

      return NextResponse.json({
        success: true,
        transaction: updatedTransaction,
        message: 'Payment confirmed successfully'
      });
    }

    // Block Regular Users from confirming non-crypto payments manually
    return NextResponse.json({
      error: 'Manual confirmation not allowed for this payment method.'
    }, { status: 403 });

  } catch (error) {
    console.error('Confirm payment API error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const csrfResult = await CSRFProtection.validateRequest(request);
  if (!csrfResult.valid) return csrfResult.response!;
  return confirmPaymentHandler(request);
}