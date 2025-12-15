import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import reportsService from '@/services/supabase/reports.service';

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { itemId, status, reviewNotes } = body;

    if (!itemId || !status) {
      return NextResponse.json({ error: 'Item ID and status are required' }, { status: 400 });
    }

    const moderationItem = await reportsService.updateModerationStatus(itemId, status, reviewNotes);

    return NextResponse.json({ moderationItem });
  } catch (error) {
    console.error('Update moderation status API error:', error);
    return NextResponse.json(
      { error: 'Failed to update moderation status' },
      { status: 500 }
    );
  }
}