import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';
import auditService from '@/services/supabase/audit.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { CSRFProtection } from '@/lib/csrf';

// Helper to verify the caller is an authenticated admin user
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

// GET /api/admin/withdrawals - list withdrawal transactions (optionally filter by status)
export async function GET(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 60 }, 'admin_withdrawals_get');
  if (!limit.ok && limit.response) return limit.response;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status'); // e.g. 'pending' | 'completed' | 'failed' | 'cancelled'

  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('type', 'withdrawal')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching withdrawals:', error);
      return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
    }

    const withdrawals =
      statusFilter && statusFilter.length > 0
        ? (data || []).filter((t: any) => t.status === statusFilter)
        : data || [];

    return NextResponse.json({ withdrawals });
  } catch (err) {
    console.error('Admin withdrawals GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 });
  }
}

// PATCH /api/admin/withdrawals - approve, reject, or send a withdrawal
// Body: { transactionId: string; action: 'approve' | 'reject' | 'send'; txHash?: string; note?: string }
const updateWithdrawalHandler = async (request: NextRequest) => {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'admin_withdrawals_patch');
  if (!limit.ok && limit.response) return limit.response;

  const { errorResponse, user } = await requireAdmin(request);
  if (errorResponse || !user) return errorResponse!;

  try {
    const body = await request.json();
    
    // Basic validation for admin withdrawal actions
    const { transactionId, action, txHash, note } = body as {
      transactionId?: string;
      action?: 'approve' | 'reject' | 'send';
      txHash?: string;
      note?: string;
    };

    if (!transactionId || typeof transactionId !== 'string' || transactionId.length === 0) {
      return NextResponse.json({ error: 'Valid transactionId is required' }, { status: 400 });
    }

    if (!action || !['approve', 'reject', 'send'].includes(action)) {
      return NextResponse.json({ error: 'Valid action is required (approve, reject, or send)' }, { status: 400 });
    }

    if (action === 'send' && (!txHash || typeof txHash !== 'string' || txHash.length === 0)) {
      return NextResponse.json({ error: 'txHash is required for send action' }, { status: 400 });
    }

    if (note && (typeof note !== 'string' || note.length > 500)) {
      return NextResponse.json({ error: 'Note must be a string with max 500 characters' }, { status: 400 });
    }

    // Load the transaction to ensure it is a pending withdrawal
    const { data: txn, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('type', 'withdrawal')
      .single();

    if (error || !txn) {
      return NextResponse.json({ error: 'Withdrawal transaction not found' }, { status: 404 });
    }

    if (txn.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending withdrawals can be updated' },
        { status: 400 }
      );
    }

    if (action === 'send') {
      if (!txHash) {
        return NextResponse.json({ error: 'txHash is required to send withdrawal' }, { status: 400 });
      }

      // Record onchain transfer row
      const { error: txError } = await (supabaseAdmin as any)
        .from('onchain_transfers')
        .insert({
          transaction_id: txn.id,
          chain: 'onchain',
          tx_hash: txHash,
          from_address: null,
          to_address: (txn.metadata as any)?.wallet_address || null,
          confirmations: 0,
          status: 'pending',
          metadata: {
            initiated_by: user.id,
            note: note || 'Withdrawal sent by admin',
          }
        });

      if (txError) {
        console.error('Failed to create onchain_transfer for withdrawal:', txError);
      }

      // Set provider_txn_id to txHash and mark transaction completed
      await transactionService.setProviderTransactionId(txn.id, txHash);
      const updated = await transactionService.updateTransactionStatus(
        txn.user_id || undefined,
        txHash,
        'completed',
        {
          source: 'manual_confirm',
          method: txn.provider || 'crypto',
          note: note || `Withdrawal broadcast by admin ${user.id}`,
          idempotencyKey: `admin_withdrawal_${transactionId}_send_${txHash}`,
        }
      );

      await auditService.logAuditEvent(
        user.id,
        'withdrawal_send',
        'transaction',
        txn.id,
        {
          txHash,
          note: note || null,
        }
      );

      return NextResponse.json({ success: true, transaction: updated });
    }

    const newStatus = action === 'approve' ? 'completed' : 'failed';

    // Use provider_txn_id as the key for consistency with the rest of the system.
    const providerKey: string = txn.provider_txn_id || txn.id;

    const updated = await transactionService.updateTransactionStatus(
      txn.user_id || undefined,
      providerKey,
      newStatus,
      {
        source: 'manual_confirm',
        method: txn.provider || 'crypto',
        note:
          note ||
          (action === 'approve'
            ? `Withdrawal approved by admin ${user.id}`
            : `Withdrawal rejected by admin ${user.id}`),
        idempotencyKey: `admin_withdrawal_${transactionId}_${action}`,
      }
    );

    const auditAction = action === 'approve' ? 'withdrawal_approve' : 'withdrawal_reject';
    await auditService.logAuditEvent(
      user.id,
      auditAction,
      'transaction',
      txn.id,
      {
        status: newStatus,
        note:
          note ||
          (action === 'approve'
            ? `Withdrawal approved by admin ${user.id}`
            : `Withdrawal rejected by admin ${user.id}`),
      }
    );

    return NextResponse.json({ success: true, transaction: updated });
  } catch (err) {
    console.error('Admin withdrawals PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  // Apply CSRF protection
  const csrfResult = await CSRFProtection.validateRequest(request);
  if (!csrfResult.valid) {
    return csrfResult.response!;
  }

  return updateWithdrawalHandler(request);
}
