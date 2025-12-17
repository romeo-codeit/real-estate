import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';
import { paymentService } from '@/services/payments/payment.service';
import auditService from '@/services/supabase/audit.service';
import { checkRateLimit } from '@/lib/rateLimit';

async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }

  const token = authHeader.substring(7);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return { errorResponse: NextResponse.json({ error: 'Invalid token' }, { status: 401 }), user: null };
  }

  const { data: userRole, error: roleError } = await supabaseAdmin
    .from('user_roles')
    .select(`
      roles!inner(name)
    `)
    .eq('user_id', user.id)
    .eq('roles.name', 'admin')
    .single();

  if (roleError || !userRole) {
    return { errorResponse: NextResponse.json({ error: 'Admin access required' }, { status: 403 }), user: null };
  }

  return { errorResponse: null, user };
}

export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'admin_transactions_approve_crypto_post');
  if (!limit.ok && limit.response) return limit.response;

  const { errorResponse, user } = await requireAdmin(request);
  if (errorResponse || !user) return errorResponse!;

  try {
    const { transactionId, adminNotes } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Get the transaction
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('type', 'deposit') // Only allow approving deposits
      .eq('provider', 'crypto') // Only crypto transactions
      .eq('status', 'pending') // Only pending transactions
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found or not eligible for approval' }, { status: 404 });
    }

    // Confirm the payment using the crypto service
    const result = await paymentService.confirmPayment('crypto', transaction.provider_txn_id || transactionId);

    if (!result.success) {
      return NextResponse.json({ error: 'Payment confirmation failed' }, { status: 400 });
    }

    // Update transaction status
    const updatedTransaction = await transactionService.updateTransactionStatus(
      transaction.user_id || undefined,
      transaction.provider_txn_id || transactionId,
      'completed',
      {
        source: 'manual_confirm',
        method: 'crypto',
        note: adminNotes,
      }
    );

    // Log the admin action
    await auditService.logAuditEvent(
      user.id,
      'approve_crypto_transaction',
      'transaction',
      transactionId,
      {
        amount: transaction.amount,
        userId: transaction.user_id,
        adminNotes,
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Crypto transaction approved successfully',
    });

  } catch (error) {
    console.error('Admin crypto approval failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}