import { NextRequest, NextResponse } from 'next/server';
import auditService from '@/services/supabase/audit.service';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import { checkRateLimit } from '@/lib/rateLimit';

// GET /api/admin/audit - Get audit logs with pagination and filtering
export async function GET(request: NextRequest) {
  try {
    const rate = checkRateLimit(request, { windowMs: 60_000, max: 60 }, 'admin_audit_get');
    if (!rate.ok && rate.response) return rate.response;
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

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const resourceType = searchParams.get('resourceType') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const filters = {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
    };

    const { logs, total } = await auditService.getAuditLogs(page, limit, filters);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}