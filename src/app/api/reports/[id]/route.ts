import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import reportsService from '@/services/supabase/reports.service';
import auditService from '@/services/supabase/audit.service';
import { checkRateLimit } from '@/lib/rateLimit';

export async function PATCH(request: NextRequest) {
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 30 }, 'admin_reports_patch');
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

    const body = await request.json();
    const { reportId, status, adminNotes } = body;

    if (!reportId || !status) {
      return NextResponse.json({ error: 'Report ID and status are required' }, { status: 400 });
    }

    const report = await reportsService.updateReportStatus(reportId, status, adminNotes);

    // Log audit event
    await auditService.logAuditEvent(
      user.id,
      'report_status_update',
      'report',
      reportId,
      {
        new_status: status,
        admin_notes: adminNotes,
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Update report status API error:', error);
    return NextResponse.json(
      { error: 'Failed to update report status' },
      { status: 500 }
    );
  }
}