import { NextRequest, NextResponse } from 'next/server';
import adminService from '@/services/supabase/admin.service';
import auditService from '@/services/supabase/audit.service';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';
import { UserRole } from '@/lib/types';
import { checkRateLimit } from '@/lib/rateLimit';
import { ValidationSchemas, ValidationHelper } from '@/lib/validation';
import { CSRFProtection } from '@/lib/csrf';
import { requireAdmin } from '@/lib/auth-utils';

// GET /api/admin/users - Get all users
export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API: Request received');
    
    const limit = checkRateLimit(request, { windowMs: 60_000, max: 60 }, 'admin_users_get');
    if (!limit.ok && limit.response) {
      console.log('Admin users API: Rate limit exceeded');
      return limit.response;
    }
    
    // Verify admin authentication
    console.log('Admin users API: Checking admin auth');
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) {
      console.log('Admin users API: Auth check failed');
      return adminOrResponse;
    }
    
    console.log('Admin users API: Auth successful, fetching users');
    const users = await adminService.getAllUsers();
    console.log(`Admin users API: Retrieved ${users?.length || 0} users`);
    
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
    const adminOrResponse = await requireAdmin(request);
    if (adminOrResponse instanceof NextResponse) {
      return adminOrResponse;
    }
    const adminUser = adminOrResponse;

    const adminUserId = adminUser.id;

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
  const limit = checkRateLimit(request, { windowMs: 60_000, max: 10 }, 'admin_users_delete');
  if (!limit.ok && limit.response) return limit.response;

  const csrfResult = await CSRFProtection.validateRequest(request);
  if (!csrfResult.valid) return csrfResult.response!;

  const adminOrResponse = await requireAdmin(request);
  if (adminOrResponse instanceof NextResponse) {
    return adminOrResponse;
  }

  try {
    const body = await request.json();
    const { userId } = body as { userId?: string };

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Prevent admins from deleting themselves
    if (userId === adminOrResponse.id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 400 });
    }

    // Ensure the user exists and capture role/email for audit
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, email')
      .eq('id', userId)
      .single();

    if (userError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Do not allow deleting the last remaining admin
    if (targetUser.role === 'admin') {
      const { count, error: countError } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (countError) {
        console.error('Failed to count admins before deletion:', countError);
        return NextResponse.json({ error: 'Unable to verify admin count' }, { status: 500 });
      }

      if ((count || 0) <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last admin account' }, { status: 400 });
      }
    }

    // Delete from auth (cascades to users and related tables via FK)
    const authResult = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authResult.error) {
      console.error('Auth user deletion failed:', authResult.error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    await auditService.logAuditEvent(
      adminOrResponse.id,
      'user_delete',
      'user',
      userId,
      {
        email: targetUser.email,
        role: targetUser.role,
      },
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      request.headers.get('user-agent') || undefined
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  // Apply CSRF protection
  const csrfResult = await CSRFProtection.validateRequest(request);
  if (!csrfResult.valid) {
    return csrfResult.response!;
  }

  return updateUserHandler(request);
}