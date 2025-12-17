import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';
import auditService from '@/services/supabase/audit.service';

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

// GET /api/admin/onchain/deposits - list pending crypto deposit transactions
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { data, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('type', 'deposit')
      .eq('provider', 'crypto')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching crypto deposits:', error);
      return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 });
    }

    const pending = (data || []).filter((t: any) => t.status === 'pending');
    return NextResponse.json({ deposits: pending });
  } catch (err) {
    console.error('Admin onchain deposits GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch deposits' }, { status: 500 });
  }
}

// PATCH /api/admin/onchain/deposits - verify a deposit with tx_hash
// Body: { transactionId: string; txHash: string; note?: string }
export async function PATCH(request: NextRequest) {
  const { errorResponse, user } = await requireAdmin(request);
  if (errorResponse || !user) return errorResponse!;

  try {
    const body = await request.json();
    const { transactionId, txHash, note } = body as { transactionId?: string; txHash?: string; note?: string };

    if (!transactionId || !txHash) {
      return NextResponse.json({ error: 'transactionId and txHash are required' }, { status: 400 });
    }

    const { data: txn, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('type', 'deposit')
      .single();

    if (error || !txn) {
      return NextResponse.json({ error: 'Deposit transaction not found' }, { status: 404 });
    }

    if (txn.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending deposits can be verified' }, { status: 400 });
    }

    // Optionally, create an onchain_transfers row for record
    const { error: txError } = await (supabaseAdmin as any)
      .from('onchain_transfers')
      .insert({
        transaction_id: txn.id,
        chain: 'onchain',
        tx_hash: txHash,
        to_address: (txn.metadata as any)?.wallet_address || null,
        confirmations: 0,
        status: 'pending',
        metadata: {
          verified_by: user.id,
          note: note || 'Verified on-chain by admin',
        },
      });

    if (txError) {
      console.error('Error creating onchain_transfers row:', txError);
      // proceed anyway; we don't want to block the status update if insert fails
    }

    // Use txHash as provider_txn_id and mark transaction completed via transactionService
    await transactionService.setProviderTransactionId(txn.id, txHash);

    const updated = await transactionService.updateTransactionStatus(
      txn.user_id || undefined,
      txHash,
      'completed',
      {
        source: 'manual_confirm',
        method: 'crypto',
        note: note || `On-chain verified by admin ${user.id}`,
        idempotencyKey: `onchain_deposit_${txHash}`,
      }
    );

    await auditService.logAuditEvent(
      user.id,
      'deposit_onchain_verify',
      'transaction',
      txn.id,
      {
        txHash,
        note: note || `On-chain verified by admin ${user.id}`,
      }
    );

    return NextResponse.json({ success: true, transaction: updated });
  } catch (err) {
    console.error('Admin onchain deposits PATCH error:', err);
    return NextResponse.json({ error: 'Failed to verify deposit' }, { status: 500 });
  }
}
