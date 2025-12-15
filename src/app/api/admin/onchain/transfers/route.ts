import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';

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

// GET /api/admin/onchain/transfers - list on-chain transfer records
export async function GET(request: NextRequest) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

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
export async function PATCH(request: NextRequest) {
  const { errorResponse } = await requireAdmin(request);
  if (errorResponse) return errorResponse;

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

    return NextResponse.json({ success: true, transfer: data });
  } catch (err) {
    console.error('Admin onchain transfers PATCH error:', err);
    return NextResponse.json({ error: 'Failed to update on-chain transfer' }, { status: 500 });
  }
}
