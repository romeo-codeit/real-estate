import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import reportsService from '@/services/supabase/reports.service';
import { checkRateLimit } from '@/lib/rateLimit';

export async function GET(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 60 }, 'moderation_get');
  if (!limit.ok && limit.response) return limit.response;

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const severity = searchParams.get('severity') as any;
    const content_type = searchParams.get('content_type') as any;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const moderationItems = await reportsService.getModerationQueue({
      status,
      severity,
      content_type,
      limit,
      offset,
    });

    return NextResponse.json({ moderationItems });
  } catch (error) {
    console.error('Get moderation queue API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation queue' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This can be called by the system or admins
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { content_type, content_id, flag_reason, severity } = body;

    // Validate required fields
    if (!content_type || !content_id || !flag_reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const moderationItem = await reportsService.addToModerationQueue({
      content_type,
      content_id,
      flag_reason,
      severity,
    });

    return NextResponse.json({ moderationItem });
  } catch (error) {
    console.error('Add to moderation queue API error:', error);
    return NextResponse.json(
      { error: 'Failed to add to moderation queue' },
      { status: 500 }
    );
  }
}