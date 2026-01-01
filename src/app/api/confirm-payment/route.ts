import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { requireAdmin } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'confirm_payment_post');
  if (!limit.ok && limit.response) return limit.response;

  try {
    // Verify user is admin
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) {
      return adminOrResponse;
    }
    const adminUser = adminOrResponse;
    const user = { id: adminUser.id, email: adminUser.email }; // Compatibility with existing code

    // Parse request body
    const body = await request.json();
    const { transactionId } = body;

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Get the transaction (Admin can confirm any user's transaction)
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      // .eq('user_id', user.id) // Removed: Admin confirms for others
      .eq('type', 'investment')
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.status !== 'pending') {
      return NextResponse.json({ error: 'Transaction is not pending' }, { status: 400 });
    }

    // Prevent manual confirmation of crypto payments - they require webhook verification
    if (transaction.provider === 'crypto') {
      return NextResponse.json({
        error: 'Crypto payments cannot be manually confirmed. They require blockchain verification through webhooks.'
      }, { status: 400 });
    }

    // Manually confirm non-crypto payments.
    const updatedTransaction = await transactionService.updateTransactionStatus(
      transaction.user_id || undefined, // Use the transaction owner's ID
      transaction.provider_txn_id || transactionId,
      'completed',
      {
        source: 'manual_confirm',
        method: transaction.provider || 'unknown',
        note: `Manual confirmation by admin ${user.email}`,
        // Deterministic key so repeated confirm calls are idempotent
        idempotencyKey: `confirm_payment_${transaction.id}`,
      }
    );

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Payment confirmed successfully'
    });

  } catch (error) {
    console.error('Confirm payment API error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}