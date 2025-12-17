import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';
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

// POST /api/admin/transactions/reconcile
// Body: { transactionId: string; action: 'refund' | 'adjust'; amount?: number; direction?: 'credit' | 'debit'; note?: string }
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'admin_transactions_reconcile_post');
  if (!limit.ok && limit.response) return limit.response;

  const { errorResponse, user } = await requireAdmin(request);
  if (errorResponse || !user) return errorResponse!;

  try {
    const body = await request.json();
    const { transactionId, action, amount, direction, note } = body as {
      transactionId?: string;
      action?: 'refund' | 'adjust';
      amount?: number;
      direction?: 'credit' | 'debit';
      note?: string;
    };

    if (!transactionId || !action) {
      return NextResponse.json({ error: 'transactionId and action are required' }, { status: 400 });
    }

    const { data: txn, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error || !txn) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (action === 'refund') {
      const refundAmount = typeof amount === 'number' ? amount : txn.amount;
      if (!refundAmount || refundAmount <= 0) {
        return NextResponse.json({ error: 'A positive refund amount is required' }, { status: 400 });
      }

      const refundTxn = await transactionService.createTransaction({
        user_id: txn.user_id as string,
        type: 'refund',
        amount: refundAmount,
        currency: txn.currency || 'USD',
        status: 'completed',
        provider: txn.provider || 'manual',
        related_object: {
          type: 'refund',
          original_transaction_id: txn.id,
        },
        metadata: {
          adjustment: true,
          original_amount: txn.amount,
          refund_reason: note || null,
          confirmation: {
            source: 'manual_confirm',
            method: 'admin_refund',
            note: note || `Admin ${user.id} issued refund`,
            status: 'completed',
            at: new Date().toISOString(),
          },
        },
      });

      await auditService.logAuditEvent(
        user.id,
        'transaction_refund',
        'transaction',
        txn.id,
        {
          original: { id: txn.id, type: txn.type, amount: txn.amount },
          refund: { id: refundTxn.id, amount: refundAmount },
          note: note || null,
        }
      );

      return NextResponse.json({ success: true, transaction: refundTxn });
    }

    if (action === 'adjust') {
      if (typeof amount !== 'number' || amount === 0 || !direction) {
        return NextResponse.json(
          { error: 'amount (non-zero) and direction are required for adjustments' },
          { status: 400 }
        );
      }

      const isCredit = direction === 'credit';
      const adjAmount = Math.abs(amount);
      const type: 'payout' | 'fee' = isCredit ? 'payout' : 'fee';

      const adjustmentTxn = await transactionService.createTransaction({
        user_id: txn.user_id as string,
        type,
        amount: adjAmount,
        currency: txn.currency || 'USD',
        status: 'completed',
        provider: txn.provider || 'manual',
        related_object: {
          type: 'adjustment',
          direction,
          original_transaction_id: txn.id,
        },
        metadata: {
          adjustment: true,
          direction,
          original_amount: txn.amount,
          adjustment_amount: adjAmount,
          note: note || null,
          confirmation: {
            source: 'manual_confirm',
            method: 'admin_adjustment',
            note: note || `Admin ${user.id} created ${direction} adjustment`,
            status: 'completed',
            at: new Date().toISOString(),
          },
        },
      });

      await auditService.logAuditEvent(
        user.id,
        'transaction_adjust',
        'transaction',
        txn.id,
        {
          original: { id: txn.id, type: txn.type, amount: txn.amount },
          adjustment: { id: adjustmentTxn.id, type, amount: adjAmount, direction },
          note: note || null,
        }
      );

      return NextResponse.json({ success: true, transaction: adjustmentTxn });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err) {
    console.error('Admin transactions reconcile POST error:', err);
    return NextResponse.json({ error: 'Failed to reconcile transaction' }, { status: 500 });
  }
}
