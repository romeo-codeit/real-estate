import { NextRequest, NextResponse } from 'next/server';
import adminService from '@/services/supabase/admin.service';
import auditService from '@/services/supabase/audit.service';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import { UserRole } from '@/lib/types';
import { checkRateLimit } from '@/lib/rateLimit';
import { withCSRFProtection } from '@/lib/csrf-middleware';
import { ValidationSchemas, ValidationHelper } from '@/lib/validation';
import { CSRFProtection } from '@/lib/csrf';

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 60 }, 'admin_users_get');
    if (!limit.ok && limit.response) return limit.response;
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

    const users = await adminService.getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/users - Update user role or status
const updateUserHandler = async (request: NextRequest) => {
  try {
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 30 }, 'admin_users_patch');
    if (!limit.ok && limit.response) return limit.response;
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = await ValidationHelper.validate(ValidationSchemas.updateUser, body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.errors },
        { status: 400 }
      );
    }
    
    const { userId, role, status } = validationResult.data;

    // Get current user (admin performing the action)
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

    const adminUserId = user.id;

    if (role) {
      // Role validation is now handled by Zod schema
      await adminService.updateUserRole(userId, role);

      // Log audit event
      await auditService.logAuditEvent(
        adminUserId,
        'user_role_update',
        'user',
        userId,
        { new_role: role },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        request.headers.get('user-agent') || undefined
      );
    }

    if (status) {
      // Status validation is now handled by Zod schema
      await adminService.updateUserStatus(userId, status);

      // Log audit event
      await auditService.logAuditEvent(
        adminUserId,
        'user_status_update',
        'user',
        userId,
        { new_status: status },
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        request.headers.get('user-agent') || undefined
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users - Delete user (Not implemented)
export async function DELETE(request: NextRequest) {
  // Even though delete is not implemented, ensure only admins can hit this endpoint
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'admin_users_delete');
  if (!limit.ok && limit.response) return limit.response;
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

  return NextResponse.json(
    { error: 'Delete user functionality not implemented' },
    { status: 501 }
  );
}

export async function PATCH(request: NextRequest) {
  // Apply CSRF protection
  const csrfResult = await CSRFProtection.validateRequest(request);
  if (!csrfResult.valid) {
    return csrfResult.response!;
  }

  return updateUserHandler(request);
}