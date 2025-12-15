import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import transactionService from '@/services/supabase/transaction.service';

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

  const { data: userProfile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || userProfile?.role !== 'admin') {
    return { errorResponse: NextResponse.json({ error: 'Admin access required' }, { status: 403 }), user: null };
  }

  return { errorResponse: null, user };
}

// GET /api/admin/webhooks/events - list recent webhook events
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let query = (supabaseAdmin as any)
      .from('webhook_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (provider) {
      query = query.eq('provider', provider);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching webhook events:', error);
      return NextResponse.json({ error: 'Failed to fetch webhook events' }, { status: 500 });
    }

    return NextResponse.json({ events: data || [] });
  } catch (err) {
    console.error('Admin webhook events GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch webhook events' }, { status: 500 });
  }
}

// POST /api/admin/webhooks/events - reprocess a webhook event
// Body: { id: string; action: 'reprocess' }
export async function POST(request: NextRequest) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { id, action } = body as { id?: string; action?: 'reprocess' };

    if (!id || action !== 'reprocess') {
      return NextResponse.json({ error: 'id and action=reprocess are required' }, { status: 400 });
    }

    const { data: eventRow, error: evError } = await (supabaseAdmin as any)
      .from('webhook_events')
      .select('*')
      .eq('id', id)
      .single();

    if (evError || !eventRow) {
      return NextResponse.json({ error: 'Webhook event not found' }, { status: 404 });
    }

    const event: any = eventRow;

    if (!event.provider_txn_id || !event.target_status) {
      return NextResponse.json({ error: 'Event is not linked to a transaction/status' }, { status: 400 });
    }

    // Load the linked transaction to get user_id for idempotent status update
    const { data: txn, error: txnError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('provider_txn_id', event.provider_txn_id)
      .single();

    if (txnError || !txn) {
      return NextResponse.json({ error: 'Linked transaction not found' }, { status: 404 });
    }

    const updated = await transactionService.updateTransactionStatus(
      txn.user_id || undefined,
      event.provider_txn_id,
      event.target_status,
      {
        source: 'gateway_webhook',
        method: event.provider,
        idempotencyKey: event.event_id || undefined,
        note: 'Reprocessed via admin webhook diagnostics',
      }
    );

    // Mark the event as reprocessed
    const { error: updError } = await (supabaseAdmin as any)
      .from('webhook_events')
      .update({ status: 'reprocessed' })
      .eq('id', id);

    if (updError) {
      console.error('Failed to mark webhook event as reprocessed:', updError);
    }

    return NextResponse.json({ success: true, transaction: updated });
  } catch (err) {
    console.error('Admin webhook events POST error:', err);
    return NextResponse.json({ error: 'Failed to reprocess webhook event' }, { status: 500 });
  }
}
