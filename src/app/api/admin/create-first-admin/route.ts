import { NextRequest, NextResponse } from 'next/server';
import authService from '@/services/supabase/auth.service';
import { supabase } from '@/services/supabase/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, secret } = await request.json();

    // Security check - only allow with special secret (can be removed after first admin is created)
    const expectedSecret = process.env.ADMIN_SETUP_SECRET || 'first-admin-setup-2025';
    if (secret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid setup secret' },
        { status: 401 }
      );
    }

    // Check if any admin already exists by looking for users with admin role
    const { data: existingAdmins } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        roles!inner(name)
      `)
      .eq('roles.name', 'admin')
      .limit(1);

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json(
        { error: 'Admin user already exists. This endpoint is disabled.' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, firstName, lastName' },
        { status: 400 }
      );
    }

    // Create the first admin user
    const { data, error } = await authService.register(
      email,
      password,
      firstName,
      lastName,
      'admin'
    );

    if (error) {
      return NextResponse.json(
        { error: (error as any)?.message || 'Registration failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'First admin user created successfully',
      user: {
        id: data.user?.id,
        email,
        firstName,
        lastName,
        role: 'admin'
      }
    });

  } catch (error) {
    console.error('Admin creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}