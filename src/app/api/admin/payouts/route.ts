import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import { ReferralService } from '@/services/supabase/referral.service';

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

// GET /api/admin/payouts - list payout transactions, optional CSV export
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const format = searchParams.get('format') || 'json';

    let query = supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('type', 'payout')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching payouts:', error);
      return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
    }

    const payouts = data || [];

    if (format === 'csv') {
      const headers = [
        'id',
        'user_id',
        'amount',
        'currency',
        'status',
        'provider',
        'provider_txn_id',
        'created_at',
      ];
      const rows = payouts.map((p: any) => [
        p.id,
        p.user_id,
        p.amount,
        p.currency,
        p.status,
        p.provider,
        p.provider_txn_id,
        p.created_at,
      ]);

      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="payouts.csv"',
        },
      });
    }

    return NextResponse.json({ payouts });
  } catch (err) {
    console.error('Admin payouts GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 });
  }
}

// PATCH /api/admin/payouts - retry referral-related payouts
// Body: { transactionId: string; action: 'retry_referral' }
export async function PATCH(request: NextRequest) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();
    const { transactionId, action } = body as { transactionId?: string; action?: 'retry_referral' };

    if (!transactionId || action !== 'retry_referral') {
      return NextResponse.json({ error: 'transactionId and action=retry_referral are required' }, { status: 400 });
    }

    const { data: txn, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error || !txn) {
      return NextResponse.json({ error: 'Payout transaction not found' }, { status: 404 });
    }

    const related = (txn.related_object || {}) as any;
    if (related.type !== 'referral_commission' || !related.referral_id) {
      return NextResponse.json({ error: 'Only referral commission payouts can be retried' }, { status: 400 });
    }

    const ok = await ReferralService.processCommissionForReferral(related.referral_id);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to reprocess referral commission' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin payouts PATCH error:', err);
    return NextResponse.json({ error: 'Failed to retry payout' }, { status: 500 });
  }
}
