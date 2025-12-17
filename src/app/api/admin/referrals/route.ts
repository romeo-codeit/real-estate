import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import { ReferralService } from '@/services/supabase/referral.service';
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

export async function GET(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 60 }, 'admin_referrals_get');
  if (!limit.ok && limit.response) return limit.response;

  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

  try {
    const { data, error } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching referrals:', error);
      return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
    }

    // Only return key admin fields
    const referrals = (data || []).map((r: any) => ({
      id: r.id,
      referrer_id: r.referrer_id,
      referee_id: r.referee_id,
      status: r.status,
      commission_amount: r.commission_amount,
      commission_paid: r.commission_paid,
      first_investment_amount: r.first_investment_amount,
      created_at: r.created_at,
    }));

    return NextResponse.json({ referrals });
  } catch (err) {
    console.error('Admin referrals GET error:', err);
    return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'admin_referrals_patch');
  if (!limit.ok && limit.response) return limit.response;

  const { errorResponse, user } = await requireAdmin(request);
  if (errorResponse || !user) return errorResponse!;

  try {
    const body = await request.json();
    const { referralId, action } = body as { referralId?: string; action?: 'process' };

    if (!referralId || action !== 'process') {
      return NextResponse.json({ error: 'referralId and action=process are required' }, { status: 400 });
    }

    const success = await ReferralService.processCommissionForReferral(referralId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to process referral' }, { status: 500 });
    }

    await auditService.logAuditEvent(
      user.id,
      'referral_payout',
      'referral',
      referralId,
      {
        note: 'Referral commission processed by admin',
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Admin referrals PATCH error:', err);
    return NextResponse.json({ error: 'Failed to process referral' }, { status: 500 });
  }
}
