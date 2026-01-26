import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import auditService from '@/services/supabase/audit.service';
import { checkRateLimit } from '@/lib/rateLimit';
import { CSRFProtection } from '@/lib/csrf';
import { requireAdmin } from '@/lib/auth-utils';

// GET /api/admin/onchain/transfers - list on-chain transfer records
export async function GET(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 60 }, 'admin_onchain_transfers_get');
  if (!limit.ok && limit.response) return limit.response;

  const adminOrResponse = await requireAdmin(request);
  if (adminOrResponse instanceof NextResponse) {
    return adminOrResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const chain = searchParams.get('chain') || undefined;

    let query = (supabaseAdmin as any)
      .from('onchain_transfers')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (chain) {
      query = query.eq('chain', chain);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching onchain transfers:', error);
      return NextResponse.json({ error: 'Failed to fetch on-chain transfers' }, { status: 500 });
    }

    return NextResponse.json({ transfers: data || [] });
  } catch (err) {
    console.error('Admin onchain transfers GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch on-chain transfers' }, { status: 500 });
  }
}

// PATCH /api/admin/onchain/transfers - update confirmations/status
// Body: { id: string; status?: string; confirmations?: number; note?: string }
async function updateTransferHandler(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 30 }, 'admin_onchain_transfers_patch');
  if (!limit.ok && limit.response) return limit.response;

  const adminOrResponse = await requireAdmin(request);
  if (adminOrResponse instanceof NextResponse) {
    return adminOrResponse;
  }
  const user = adminOrResponse;

  try {
    const body = await request.json();
    const { id, status, confirmations, note } = body as {
      id?: string;
      status?: string;
      confirmations?: number;
      note?: string;
    };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof confirmations === 'number') {
      updates.confirmations = confirmations;
    }
    if (status) {
      updates.status = status;
    }
    if (note) {
      updates.metadata = { note };
    }

    const { data, error } = await (supabaseAdmin as any)
      .from('onchain_transfers')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating onchain transfer:', error);
      return NextResponse.json({ error: 'Failed to update on-chain transfer' }, { status: 500 });
    }

    // Log audit event
    await auditService.logAuditEvent(
      user.id,
      'onchain_transfer_update',
      'onchain_transfer',
      id,
      {
        status,
        confirmations,
        note,
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ success: true, transfer: data });
  } catch (err) {
    console.error('Admin onchain transfers PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update on-chain transfer' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const csrfResult = await CSRFProtection.validateRequest(request);
  if (!csrfResult.valid) return csrfResult.response!;
  return updateTransferHandler(request);
}
