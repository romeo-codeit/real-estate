import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';
import { paymentService } from '@/services/payments/payment.service';
import auditService from '@/services/supabase/audit.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { CSRFProtection } from '@/lib/csrf';
import { requireAdmin } from '@/lib/auth-utils';

async function approveInvestmentCryptoHandler(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'admin_transactions_approve_investment_crypto_post');
  if (!limit.ok && limit.response) return limit.response;

  const adminOrResponse = await requireAdmin(request);
  if (adminOrResponse instanceof NextResponse) return adminOrResponse;
  const admin = adminOrResponse;

  try {
    const { transactionId, adminNotes, txHash } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }

    // Require an on-chain reference (hash or memo) to avoid blind approvals
    if (!txHash || typeof txHash !== 'string' || txHash.trim().length < 6) {
      return NextResponse.json({ error: 'A transaction hash/identifier is required for approval.' }, { status: 400 });
    }

    // Only allow confirming pending or waiting_confirmation crypto investment transactions
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('type', 'investment')
      .eq('provider', 'crypto')
      .in('status', ['pending', 'waiting_confirmation'])
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found or not eligible for approval' }, { status: 404 });
    }

    // Confirm the payment using the crypto service (idempotent check happens downstream)
    const result = await paymentService.confirmPayment('crypto', transaction.provider_txn_id || transactionId);
    if (!result.success) {
      return NextResponse.json({ error: 'Payment confirmation failed' }, { status: 400 });
    }

    // Mark transaction completed; this will activate the linked investment and set its start_date
    const updatedTransaction = await transactionService.updateTransactionStatus(
      transaction.user_id || undefined,
      transaction.provider_txn_id || transactionId,
      'completed',
      {
        source: 'manual_confirm',
        method: 'crypto',
        note: adminNotes,
        idempotencyKey: `approve_investment_crypto_${transaction.id}`,
      }
    );

    // Attach tx hash for auditability
    const existingMeta = ((transaction as any).metadata as Record<string, any>) || {};

    await supabaseAdmin
      .from('transactions')
      .update({
        metadata: {
          ...existingMeta,
          txHash,
          manualApproval: true,
          manualApprovalAt: new Date().toISOString(),
        },
      } as any)
      .eq('id', transaction.id);

    // Audit trail for compliance
    await auditService.logAuditEvent(
      admin.id,
      'approve_investment_crypto_transaction',
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
      message: 'Crypto investment approved and activated',
    });
  } catch (error) {
    console.error('Admin crypto investment approval failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const csrfResult = await CSRFProtection.validateRequest(request);
  if (!csrfResult.valid) return csrfResult.response!;
  return approveInvestmentCryptoHandler(request);
}
