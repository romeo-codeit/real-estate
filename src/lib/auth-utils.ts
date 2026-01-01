import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/services/supabase/supabase-admin';

export type AdminUser = {
    id: string;
    email: string | undefined;
    role: 'admin';
};

/**
 * Validates that the request is authenticated by an admin user.
 * Returns the user object if successful, or a NextResponse with error if not.
 * 
 * Usage:
 * const adminOrResponse = await requireAdmin(request);
 * if (adminOrResponse instanceof NextResponse) return adminOrResponse;
 * const admin = adminOrResponse;
 */
export async function requireAdmin(request: NextRequest): Promise<AdminUser | NextResponse> {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // 1. Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Check role in users table
    const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (userError || !userData || userData.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    return {
        id: user.id,
        email: user.email,
        role: 'admin'
    };
}

export type AuthenticatedUser = {
    id: string;
    email: string | undefined;
    emailConfirmed: boolean;
};

/**
 * Validates that the request is authenticated and the user's email is verified.
 * Returns the user object if successful, or a NextResponse with error if not.
 * 
 * Usage:
 * const userOrResponse = await requireEmailVerified(request);
 * if (userOrResponse instanceof NextResponse) return userOrResponse;
 * const user = userOrResponse;
 */
export async function requireEmailVerified(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // 1. Verify token and get user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Check email verification
    const emailConfirmed = !!user.email_confirmed_at;

    if (!emailConfirmed) {
        return NextResponse.json({
            error: 'Email verification required',
            code: 'EMAIL_NOT_VERIFIED',
            message: 'Please verify your email address before making deposits or investments. Check your inbox for the verification link.'
        }, { status: 403 });
    }

    return {
        id: user.id,
        email: user.email,
        emailConfirmed: true
    };
}

/**
 * Validates authentication without requiring email verification.
 * Use this for read-only operations or operations that don't involve funds.
 */
export async function requireAuth(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return {
        id: user.id,
        email: user.email,
        emailConfirmed: !!user.email_confirmed_at
    };
}
